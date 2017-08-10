function DisplayConfirmation(title, message, confirm_callback, callbackData) {
    // Define the Dialog and its properties.
    $("#dialog-confirm").html(message);
    $("#dialog-confirm").dialog({
        resizable: false,
        modal: true,
        title: title,
        width: 400,
        buttons: {
            "Delete": function () {
                $(this).dialog('close');
                confirm_callback(true, callbackData);
            },
            "Cancel": function () {
                $(this).dialog('close');
                confirm_callback(false, callbackData);
            }
        }
    });
}
function PostAjax(endpoint, post_data, success_callback, error_callback) {
    $.ajax({
        url: endpoint,
        data: post_data,
        processData: false,
        contentType: false,
        type: "POST",
        success: success_callback,
        error: error_callback
    });
}
function UploadImage(parent_form, post_data) {
    // Get a reference to the parent form, needed for the proper transmission of file data
    if (parent_form.length <= 0)
        return;

    // Disable the parent form for now
    parent_form.prop("disabled", true);
    // Show onlye the progress bar for this form container
    $(parent_form).find(".progress").show();

    // Hide the Upload and Cancel Buttons
    $(parent_form).find("#submit_upload").hide();
    $(parent_form).find("#cancel_upload").hide();

    // Get a reference to the progress bar and remove the error state if applicable
    var progress_bar = $(parent_form).find(".progress-bar");
    progress_bar.css("width", "0%");
    progress_bar.removeClass("progress-bar-danger");
    progress_bar.html("");

    $.ajax({
        url: "/ImageUpload/CreateImage",
        data: post_data,
        processData: false,
        contentType: false,
        type: "POST",
        xhr: function () {
            // Subscribe to the requests progress event.  This will allow us to report on the progress
            var xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function (evt) {
                if (evt.lengthComputable) {
                    var progress = Math.round(evt.loaded / evt.total * 100);
                    progress_bar.width(progress + "%");
                }
            }, false);
            return xhr;
        },
        success: function (data) {
            parent_form.prop("disabled", false);

            if (data.success === true) {
                $(parent_form).find("#finish_upload").show();

                var div_item = $("<div/>");
                div_item.addClass("gallery_image");

                var figure_item = $("<figure/>");
                figure_item.attr("image_id", data.image_id);

                var image_item = $("<img/>");
                image_item.attr("src", data.image_location);
                image_item.attr("alt", data.image_desc);

                var caption_item = $("<figcaption/>");
                caption_item.html(data.image_name);

                figure_item.append(image_item, caption_item);
                div_item.append(figure_item);

                $(".gallery").append(div_item);
            } else {
                // Report the error to the user and change to "danger"
                progress_bar.addClass('progress-bar-danger');
                progress_bar.html(data.response);
                
                $("#cancel_upload").show();
            }
        },
        error: function (xhr, status, error) {
            parent_form.prop("disabled", false);
            // Report the error to the user and change to "danger"
            progress_bar.addClass('progress-bar-danger');
            progress_bar.html(error);

            $(parent_form).find("#cancel_upload").show();
        }
    });
}