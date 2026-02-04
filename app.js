document.addEventListener('DOMContentLoaded', () => {
    // State
    let grades = [];

    // DOM Elements
    const gradeForm = document.getElementById('gradeForm');
    const subjectInput = document.getElementById('subject');
    const scoreInput = document.getElementById('score');
    const targetInput = document.getElementById('target');
    const gradeList = document.getElementById('gradeList');
    const averageDisplay = document.getElementById('averageDisplay');
    const calcBtn = document.getElementById('calcBtn');
    const filterInput = document.getElementById('filterInput');
    const chartSection = document.getElementById('chartSection');
    const chartContainer = document.getElementById('chartContainer');

    // -- Event Listeners --

    gradeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addGrade();
    });

    calcBtn.addEventListener('click', calculateAverage);

    filterInput.addEventListener('input', (e) => {
        renderList(e.target.value);
    });

    // -- Functions --

    function addGrade() {
        const subject = subjectInput.value.trim();
        const score = parseFloat(scoreInput.value);
        const target = parseFloat(targetInput.value);

        if (!subject || isNaN(score) || isNaN(target)) {
            alert('Please fill in all fields correctly.');
            return;
        }

        // Check for duplicate subject names
        const existingSubject = grades.find(g => g.subject.toLowerCase() === subject.toLowerCase());
        if (existingSubject) {
            alert('Subject "' + subject + '" already exists. Please use a different name.');
            return;
        }

        const newGrade = {
            id: Date.now(),
            subject,
            score,
            target
        };

        grades.push(newGrade);

        // Reset Inputs
        subjectInput.value = '';
        scoreInput.value = '';
        targetInput.value = '';
        subjectInput.focus();

        renderList();
        renderChart();
        renderRadarChart();
    }

    function calculateAverage() {
        if (grades.length === 0) {
            averageDisplay.textContent = '0';
            return;
        }

        const sum = grades.reduce((acc, curr) => acc + curr.score, 0);
        const avg = sum / grades.length;
        averageDisplay.textContent = avg.toFixed(1); // 1 decimal place
    }

    function renderList(filterText = '') {
        gradeList.innerHTML = '';

        const text = filterText.toLowerCase();
        const filteredGrades = grades.filter(g => g.subject.toLowerCase().includes(text));

        if (filteredGrades.length === 0) {
            gradeList.innerHTML = '<div class="empty-state">No grades found.</div>';
            return;
        }

        filteredGrades.forEach(grade => {
            const isAchieved = grade.score >= grade.target;
            const statusLabel = isAchieved ? 'Target Achieved' : 'Target Not Achieved';
            const statusClass = isAchieved ? 'status-success' : 'status-fail';

            const item = document.createElement('div');
            item.className = 'grade-item';
            item.innerHTML = `
                <div class="grade-info">
                    <h3>${grade.subject}</h3>
                    <div class="grade-meta">Target: ${grade.target}</div>
                    <div class="status-badge ${statusClass}">${statusLabel}</div>
                </div>
                <div class="grade-actions">
                    <span class="score-badge">${grade.score}</span>
                    <button class="btn-delete" onclick="window.deleteGrade(${grade.id})" title="Hapus">✕</button>
                </div>
            `;
            gradeList.appendChild(item);
        });
    }

    function renderChart() {
        if (grades.length > 0) {
            chartSection.style.display = 'block';
            chartContainer.innerHTML = '';

            grades.forEach(grade => {
                const row = document.createElement('div');
                row.className = 'chart-row';

                // Calculate percentage for bar width, capped at 100%
                const fillWidth = Math.min(grade.score, 100);
                // Target marker position
                const targetPos = Math.min(grade.target, 100);

                row.innerHTML = `
                    <div class="chart-label">
                        <span>${grade.subject}</span>
                        <span>${grade.score}/${grade.target}</span>
                    </div>
                    <div class="chart-bar-bg">
                        <div class="chart-bar-fill" style="width: ${fillWidth}%; background-color: ${grade.score >= grade.target ? 'var(--primary-color)' : 'var(--danger-color)'}"></div>
                        <div class="chart-target-line" style="left: ${targetPos}%" title="Target: ${grade.target}"></div>
                    </div>
                `;
                chartContainer.appendChild(row);
            });
        } else {
            chartSection.style.display = 'none';
        }
    }

    // Radar Chart Elements
    const radarSection = document.getElementById('radarSection');
    const radarChart = document.getElementById('radarChart');
    const radarLegend = document.getElementById('radarLegend');

    // Delete grade function (exposed to window for onclick)
    window.deleteGrade = function (id) {
        grades = grades.filter(g => g.id !== id);
        renderList(filterInput.value);
        renderChart();
        renderRadarChart();
        calculateAverage();
    };

    function renderRadarChart() {
        if (grades.length < 3) {
            radarSection.style.display = 'none';
            return;
        }

        radarSection.style.display = 'block';

        const cx = 175; // Center X
        const cy = 175; // Center Y
        const maxRadius = 130; // Maximum radius for the chart
        const levels = 5; // Number of concentric circles
        const numAxes = grades.length;
        const angleStep = (2 * Math.PI) / numAxes;

        // Clear previous content
        radarChart.innerHTML = '';

        // Create gradient definitions
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#818cf8;stop-opacity:0.6" />
            </linearGradient>
        `;
        radarChart.appendChild(defs);

        // Draw concentric circles (grid) - no numeric labels
        for (let i = 1; i <= levels; i++) {
            const r = (maxRadius / levels) * i;
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', cx);
            circle.setAttribute('cy', cy);
            circle.setAttribute('r', r);
            circle.setAttribute('class', 'radar-grid');
            radarChart.appendChild(circle);
        }

        // Draw axis lines and labels
        const points = [];
        grades.forEach((grade, i) => {
            const angle = angleStep * i - Math.PI / 2; // Start from top
            const x = cx + maxRadius * Math.cos(angle);
            const y = cy + maxRadius * Math.sin(angle);

            // Axis line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', cx);
            line.setAttribute('y1', cy);
            line.setAttribute('x2', x);
            line.setAttribute('y2', y);
            line.setAttribute('class', 'radar-axis');
            radarChart.appendChild(line);

            // Calculate data point position
            const value = Math.min(grade.score, 100) / 100;
            const px = cx + maxRadius * value * Math.cos(angle);
            const py = cy + maxRadius * value * Math.sin(angle);
            points.push({ x: px, y: py, grade });

            // Axis label - positioned further outside with larger offset
            const labelOffset = maxRadius + 35;
            const labelX = cx + labelOffset * Math.cos(angle);
            const labelY = cy + labelOffset * Math.sin(angle);
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', labelX);
            label.setAttribute('y', labelY);
            label.setAttribute('class', 'radar-label');
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('dominant-baseline', 'middle');

            // Truncate long subject names
            const maxLen = 8;
            const displayName = grade.subject.length > maxLen
                ? grade.subject.substring(0, maxLen) + '...'
                : grade.subject;
            label.textContent = displayName;
            radarChart.appendChild(label);
        });

        // Draw data polygon
        const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', polygonPoints);
        polygon.setAttribute('class', 'radar-polygon');
        radarChart.appendChild(polygon);

        // Draw data points with hover tooltip
        points.forEach(p => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', p.y);
            circle.setAttribute('r', 6);
            circle.setAttribute('class', p.grade.score >= p.grade.target ? 'radar-point success' : 'radar-point fail');
            circle.style.cursor = 'pointer';

            // Hover events for tooltip
            circle.addEventListener('mouseenter', (e) => {
                showRadarTooltip(e, p.grade);
            });
            circle.addEventListener('mouseleave', () => {
                hideRadarTooltip();
            });

            radarChart.appendChild(circle);
        });

        // Render legend
        radarLegend.innerHTML = '';
        grades.forEach(grade => {
            const isAchieved = grade.score >= grade.target;
            const legendItem = document.createElement('div');
            legendItem.className = 'radar-legend-item';
            legendItem.innerHTML = `
                <span class="legend-dot ${isAchieved ? 'success' : 'fail'}"></span>
                <span class="legend-text">${grade.subject}: ${grade.score}</span>
            `;
            radarLegend.appendChild(legendItem);
        });
    }

    // Tooltip element for radar chart
    let radarTooltip = null;

    function createRadarTooltip() {
        if (!radarTooltip) {
            radarTooltip = document.createElement('div');
            radarTooltip.className = 'radar-tooltip';
            document.body.appendChild(radarTooltip);
        }
        return radarTooltip;
    }

    function showRadarTooltip(event, grade) {
        const tooltip = createRadarTooltip();
        const isAchieved = grade.score >= grade.target;
        const status = isAchieved ? '✓' : '✗';
        const statusClass = isAchieved ? 'success' : 'fail';

        tooltip.innerHTML = `
            <div class="tooltip-title">${grade.subject}</div>
            <div class="tooltip-score">Score: <strong>${grade.score}</strong></div>
            <div class="tooltip-target">Target: ${grade.target}</div>
            <div class="tooltip-status ${statusClass}">${status} ${isAchieved ? 'Achieved' : 'Not Achieved'}</div>
        `;

        // Position tooltip near the mouse
        const rect = event.target.getBoundingClientRect();
        const tooltipX = rect.left + window.scrollX + 15;
        const tooltipY = rect.top + window.scrollY - 10;

        tooltip.style.left = tooltipX + 'px';
        tooltip.style.top = tooltipY + 'px';
        tooltip.classList.add('visible');
    }

    function hideRadarTooltip() {
        if (radarTooltip) {
            radarTooltip.classList.remove('visible');
        }
    }
});
