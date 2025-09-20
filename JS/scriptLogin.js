document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toastEl = document.getElementById('authToast');
    const toastBody = document.getElementById('authToastBody');
    const bsToast = new bootstrap.Toast(toastEl, { delay: 3500 });

    function showToast(message, type = 'success') {
    toastEl.classList.remove('text-bg-success','text-bg-danger','text-bg-info','text-bg-warning');
    if (type === 'success') toastEl.classList.add('text-bg-success');
    else if (type === 'danger') toastEl.classList.add('text-bg-danger');
    else if (type === 'info') toastEl.classList.add('text-bg-info');
    else if (type === 'warning') toastEl.classList.add('text-bg-warning');

    toastBody.textContent = message;
    bsToast.show();
    setTimeout(()=>{ try { toastEl.focus(); } catch(e){} }, 50);
    }

    function handleNativeValidation(form) {
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return false;
    }
    return true;
    }

    // LOGIN submit (simulado)
    loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!handleNativeValidation(loginForm)) return;

    // Aquí puedes hacer fetch('/api/login', ...) si tienes backend
    showToast('Inicio de sesión exitoso. ¡Bienvenido!', 'success');
    loginForm.reset();
    loginForm.classList.remove('was-validated');
    });

    // REGISTRO submit (simulado)
    registerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!handleNativeValidation(registerForm)) return;

    const pwd = document.getElementById('regPassword').value;
    const pwdConfirm = document.getElementById('regPasswordConfirm').value;
    if (pwd !== pwdConfirm) {
        const cf = document.getElementById('regPasswordConfirm');
        cf.classList.add('is-invalid');
        cf.focus();
        showToast('Las contraseñas no coinciden.', 'danger');
        return;
    } else {
        document.getElementById('regPasswordConfirm').classList.remove('is-invalid');
    }

    // Aquí puedes hacer fetch('/api/register', ...) si tienes backend
    showToast('Registro exitoso. Bienvenido a Kizzez 😊', 'success');
    registerForm.reset();
    registerForm.classList.remove('was-validated');
    });

    const regPwdConfirm = document.getElementById('regPasswordConfirm');
    if (regPwdConfirm) {
    regPwdConfirm.addEventListener('input', function () {
        if (this.classList.contains('is-invalid')) this.classList.remove('is-invalid');
    });
    }
});