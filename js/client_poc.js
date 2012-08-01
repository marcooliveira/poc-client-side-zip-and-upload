(function (obj) {
    // set up worker scripts path
    zip.workerScriptsPath = '/js/';

    // get the file system api, depending on browser
    var requestFileSystem = obj.webkitRequestFileSystem || obj.mozRequestFileSystem || obj.requestFileSystem;
 
    // error handling function
    function onErrorHandler(message) {
        var msg = '';

        switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
                msg = 'QUOTA_EXCEEDED_ERR';
                break;
            case FileError.NOT_FOUND_ERR:
                msg = 'NOT_FOUND_ERR';
                break;
            case FileError.SECURITY_ERR:
                msg = 'SECURITY_ERR';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'INVALID_MODIFICATION_ERR';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'INVALID_STATE_ERR';
                break;
            default:
                msg = 'Unknown Error';
            break;
        };

        console.log('Error: ' + msg);
    }

    //  function for creating a temporary file
    function createTempFile(callback) {
        var tmpFilename = "tmp.zip";

        // function called upon initialization of the File System API
        var onInitFs = function (filesystem) {
            function create() {
                filesystem.root.getFile(
                    tmpFilename,
                    {
                        create: true
                    },
                    function (zipFile) {
                        console.log("creating", zipFile);
                        callback(zipFile);
                    }
                );
            }

            filesystem.root.getFile(tmpFilename, null, function (entry) {
                entry.remove(create, create);
            }, create);
        };

        // allocate temporary file system
        requestFileSystem(TEMPORARY, 4 * 1024 * 1024 * 1024 /* 4GB */, onInitFs, onErrorHandler);
    }
 
    var model = (function () {
        var zipFileEntry,
            zipWriter,
            writer,
            creationMethod,
            URL = obj.webkitURL || obj.mozURL || obj.URL
        ;
 
        return {
            setCreationMethod: function (method) {
                // method can be either Blob (in RAM) or File (persistent storage, but storage quota is enforced)
                creationMethod = method;
            },

            addFiles: function addFiles(files, oninit, onadd, onprogress, onend) {
                var addIndex = 0;
 
                function nextFile() {
                    var file = files[addIndex];
                    onadd(file);
                    zipWriter.add(file.name, new zip.BlobReader(file), function () {
                        addIndex++;
                        if (addIndex < files.length) nextFile();
                        else onend();
                    }, onprogress);
                }
 
                function createZipWriter() {
                    zip.createWriter(writer, function (writer) {
                        zipWriter = writer;
                        oninit();
                        nextFile();
                    }, onErrorHandler);
                }
                
                // if zipWriter exists, handle next file
                if (zipWriter) nextFile();
                // else, create the zipWriter for the selected method
                else if (creationMethod == "Blob") {
                    writer = new zip.BlobWriter();
                    createZipWriter();
                } else {
                    createTempFile(function (fileEntry) {
                        zipFileEntry = fileEntry;
                        writer       = new zip.FileWriter(zipFileEntry);
                        createZipWriter();
                    });
                }
            },
            getBlob: function (callback) {
                zipWriter.close(function (blob) {

                    callback(blob);

                    zipWriter = null;
                });
            }
        };
    })();
 
    (function () {
        var fileInput           = document.getElementById("file-input"),
            zipProgress         = document.createElement("progress"),
            downloadButton      = document.getElementById("download-button"),
            fileList            = document.getElementById("file-list"),
            filenameInput       = document.getElementById("filename-input"),
            creationMethodInput = document.getElementById("creation-method-input")
            uploadButton        = document.getElementById("upload-button");

        if (typeof requestFileSystem == "undefined") creationMethodInput.options.length = 1;

        model.setCreationMethod(creationMethodInput.value);

        // when files are selected
        fileInput.addEventListener('change', function () {
            fileInput.disabled           = true;
            creationMethodInput.disabled = true;

            model.addFiles(
                // files
                fileInput.files,
                // oninit
                function () {
                    console.log("Initializing ZIP");
                },
                //onadd
                function (file) {
                    console.log("Adding file", file.name);

                    var li = document.createElement("li");
                    zipProgress.value = 0;
                    zipProgress.max = 0;
                    li.textContent = file.name;
                    li.appendChild(zipProgress);
                    fileList.appendChild(li);
                },
                // onprogress
                function (current, total) {
                    zipProgress.value = current;
                    zipProgress.max = total;
                },
                // onend
                function () {
                    console.log("Finished ZIP");

                    if (zipProgress.parentNode) zipProgress.parentNode.removeChild(zipProgress);
                    fileInput.value = "";
                    fileInput.disabled = false;
                }
            );
        }, false);

        // when the creation method is changed, update model
        creationMethodInput.addEventListener('change', function () {
            model.setCreationMethod(creationMethodInput.value);
        }, false);

        // add listener to upload link
        uploadButton.addEventListener("click", function (event) {
            // get the generated file
            model.getBlob(function (blob) {
                // create new request for submiting form data
                var request  = new XMLHttpRequest(),
                    formData = new FormData();

                // append file to the form
                formData.append("file", blob, filenameInput.value);

                // configure request
                request.open("POST","/upload", true);
                request.onreadystatechange = function () {

                    console.log(arguments);
                };

                // execute request
                request.send(formData);
            });
        });
 
    })();
 
})(this);