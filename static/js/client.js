/* element references */
const dropUpload = document.getElementById('drop-upload');
const dropView = document.getElementById('drop-view');
const frmUpload = document.getElementById('frm-upload');
const frmView = document.getElementById('frm-view');
const toggleUploadPriv = document.getElementById('upload-priv-tog');
const checkUploadPriv = document.getElementById('upload-priv');
const containerUploadViewPass = document.getElementById('upload-view-pass-container');

/* add event handlers */
dropUpload.addEventListener('click', (event) => {
    if (dropUpload.classList.contains("drop-btn-open")) {
        frmUpload.classList.remove("drop-frm-open");
        dropUpload.classList.remove("drop-btn-open");
    } else {
        frmUpload.classList.add("drop-frm-open");
        dropUpload.classList.add("drop-btn-open");
    }
})

dropView.addEventListener('click', (event) => {
    if (dropView.classList.contains("drop-btn-open")) {
        frmView.classList.remove("drop-frm-open");
        dropView.classList.remove("drop-btn-open");
    } else {
        frmView.classList.add("drop-frm-open");
        dropView.classList.add("drop-btn-open");
    }
})

toggleUploadPriv.addEventListener('click', (event) => {
    if (checkUploadPriv.checked) {
        toggleUploadPriv.innerText = "NO";
        checkUploadPriv.checked = false;
        containerUploadViewPass.classList.add('hide');
    } else {
        toggleUploadPriv.innerText = "YES";
        checkUploadPriv.checked = true;
        containerUploadViewPass.classList.remove('hide');
    }
})