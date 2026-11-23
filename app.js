if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((reg) => console.log('Service Worker registrado con alcance:', reg.scope))
            .catch((err) => console.error('Error al registrar Service Worker:', err));
    });
}

let eventoInstalacionDiferido = null;
let streamActual = null;
let modoCamaraActual = 'environment';

const btnInstalar = document.getElementById('btn-instalar');
const mensajeEstado = document.getElementById('mensaje-estado');
const avisoPermiso = document.getElementById('aviso-permiso');
const btnPrepararCamara = document.getElementById('btn-preparar-camara');
const btnConfirmarPermiso = document.getElementById('btn-confirmar-permiso');
const btnCancelarPermiso = document.getElementById('btn-cancelar-permiso');
const btnAlternarCamara = document.getElementById('btn-alternar-camara');
const btnApagarCamara = document.getElementById('btn-apagar-camara');
const visorVideo = document.getElementById('visor-camara');

function actualizarMensajeEstado(texto) {
    mensajeEstado.textContent = texto;
}

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    eventoInstalacionDiferido = event;
    btnInstalar.hidden = false;
});

btnInstalar.addEventListener('click', () => {
    if (!eventoInstalacionDiferido) return;

    eventoInstalacionDiferido.prompt();
    eventoInstalacionDiferido.userChoice
        .then((resultado) => {
            if (resultado.outcome === 'accepted') {
                btnInstalar.hidden = true;
            }
            eventoInstalacionDiferido = null;
        })
        .catch((err) => console.error('Error en el proceso de instalación:', err));
});

function detenerCamaraActiva() {
    if (streamActual) {
        streamActual.getTracks().forEach((track) => {
            track.stop();
        });
        streamActual = null;
    }
}

function iniciarCamara(modo) {
    detenerCamaraActiva();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        actualizarMensajeEstado('Tu navegador no soporta la API de cámara o no estás en HTTPS.');
        return Promise.reject(new Error('API no soportada'));
    }

    actualizarMensajeEstado('Solicitando acceso al sensor...');

    const restricciones = {
        video: { facingMode: modo },
        audio: false
    };

    return navigator.mediaDevices.getUserMedia(restricciones)
        .then((stream) => {
            streamActual = stream;
            visorVideo.srcObject = stream;
            btnAlternarCamara.disabled = false;
            btnApagarCamara.disabled = false;
            btnPrepararCamara.disabled = true;
            actualizarMensajeEstado(`Cámara activa (${modo === 'environment' ? 'Trasera' : 'Frontal'})`);
        })
        .catch((error) => {
            btnAlternarCamara.disabled = true;
            btnApagarCamara.disabled = true;
            btnPrepararCamara.disabled = false;

            if (error.name === 'NotAllowedError') {
                actualizarMensajeEstado('Permiso denegado. Habilita el acceso a la cámara en los ajustes de tu navegador.');
            } else if (error.name === 'NotFoundError') {
                actualizarMensajeEstado('No se detectó el sensor de cámara solicitado en este dispositivo.');
            } else {
                actualizarMensajeEstado(`Error al acceder al hardware: ${error.message}`);
            }
        })
        .finally(() => {
            console.log('Intento de acceso a cámara finalizado.');
        });
}

btnPrepararCamara.addEventListener('click', () => {
    avisoPermiso.hidden = false;
});

btnCancelarPermiso.addEventListener('click', () => {
    avisoPermiso.hidden = true;
    actualizarMensajeEstado('Solicitud cancelada por el usuario.');
});

btnConfirmarPermiso.addEventListener('click', () => {
    avisoPermiso.hidden = true;
    iniciarCamara(modoCamaraActual);
});

btnAlternarCamara.addEventListener('click', () => {
    modoCamaraActual = modoCamaraActual === 'environment' ? 'user' : 'environment';
    iniciarCamara(modoCamaraActual);
});

btnApagarCamara.addEventListener('click', () => {
    detenerCamaraActiva();
    visorVideo.srcObject = null;
    btnAlternarCamara.disabled = true;
    btnApagarCamara.disabled = true;
    btnPrepararCamara.disabled = false;
    actualizarMensajeEstado('Cámara apagada.');
});