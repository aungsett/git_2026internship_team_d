// Design 3: Fresh Minimal - Scripts
document.addEventListener('DOMContentLoaded', function() {
    // File upload
    const fileUpload = document.getElementById('fileUpload');
    if (fileUpload) {
        fileUpload.addEventListener('dragover', e => { e.preventDefault(); fileUpload.style.borderColor = '#a78bfa'; fileUpload.style.background = '#faf5ff'; });
        fileUpload.addEventListener('dragleave', () => { fileUpload.style.borderColor = '#cbd5e1'; fileUpload.style.background = ''; });
        fileUpload.addEventListener('drop', e => { e.preventDefault(); fileUpload.style.borderColor = '#cbd5e1'; fileUpload.style.background = ''; });
    }

    // Form submission
    const form = document.getElementById('applicationForm');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const btn = document.querySelector('.btn-submit');
            btn.textContent = 'Submitting...';
            setTimeout(() => {
                btn.textContent = '✓ Submitted!';
                btn.style.background = 'linear-gradient(135deg, #34d399, #10b981)';
            }, 1500);
        });
    }

    // Select all checkbox
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            document.querySelectorAll('.row-check').forEach(cb => cb.checked = this.checked);
            updateCount();
        });
        document.querySelectorAll('.row-check').forEach(cb => cb.addEventListener('change', updateCount));
    }
});

function updateCount() {
    const count = document.querySelectorAll('.row-check:checked').length;
    const el = document.getElementById('selectedCount');
    if (el) el.textContent = count;
}

function exportCSV() { alert('Exporting to CSV...'); }
function viewApplicant(id) { window.location.href = 'applicant-detail.html?id=' + id; }
