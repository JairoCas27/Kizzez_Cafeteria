//formulario
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contactForm');
    const toastEl = document.getElementById('successToast');
    const bsToast = new bootstrap.Toast(toastEl, { delay: 4500 });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validación nativa de HTML + mostrar estilos de Bootstrap
        if (!form.checkValidity()) {
        form.classList.add('was-validated');
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
        }

        // Mostrar toast de éxito
        bsToast.show();

        // Limpiar formulario y quitar estilos de validación
        form.reset();
        form.classList.remove('was-validated');

        // Enfocar el toast para usuarios de lector de pantalla (opcional)
        setTimeout(() => {
        try { toastEl.focus(); } catch (err) { /* ignore */ }
        }, 50);
    });
});