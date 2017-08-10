$(function () {

    // Event Delegates
    // ------------------------- GLOBAL UI EVENTS -------------------------
    // Any elements implementing dismiss-alert will hide it's immediate parent.  Used 
    // for dismissing alerts
    $(document).on('click', '.dismiss-alert', function () {
        $(this).parent().hide();
    });
    // Handle Showing/Hiding Panel Content
    $(document).on('click', '.collapsable', function () {
        toggle_panel($(this));
    });
    // ------------------------- GLOBAL UI EVENTS -------------------------

    // ------------------------- ALBUM PANEL UI EVENTS -------------------------
    // Handle Adding an Album
    $(document).on('click', '.glyphicon-plus-sign', function () {
        // Add Glyph - glyphicon-plus-sign
        toggle_album_form(true, null);
    });
    // Handle Editing An Album
    $(document).on('click', '.glyphicon-cog', function () {
        var album_data = {
            "id" : $(this).closest("li").attr('album_id'),
            "name" : $(this).closest("li").find('.nav-link').text(),
            "description" : $(this).closest("li").find('.nav-link').attr("data-toggle")
        };
        toggle_album_form(true, album_data);
    });
    // Handle Deleting an Album
    $(document).on('click', '#album_panel .glyphicon-trash', function () {
        // Delete Glyph - glyphicon-trash
        DisplayConfirmation("Confirm Album Delete?",
            "This will also delete all images included within this album.<br/><br/>Are you Sure?",
            function (confirmed, album_id) {
                if (confirmed) {
                    if (Number.isInteger(parseInt(album_id))) {

                        var post_data = new FormData();
                        post_data.append("id", parseInt(album_id));

                        PostAjax("/ImageUpload/DeleteAlbum", post_data,
                            function (data, status) {
                                if (data.success === true) {
                                    var element = $('li[album_id="' + data.album_id + '"]');
                                    element.remove();
                                } else {
                                    display_error("album_error", data.response);
                                }
                            },
                            function () {
                                display_error("album_error", "Error Deleting Album");
                            }
                        );
                    } else {
                        display_error("album_error", "Unable to Delete Album.  Invalid ID [" + album_id + "");
                    }
                }
            },
            $(this).closest("li").attr('album_id'));
    });
    // Handle Submitting a New/Modified Album
    $("#submit_album").on("click", function () {

        // Validate values on the form, if there are any invalid objects the plugin will
        // provide the user a visual
        if (!$("#album_form").valid())
            return;

        // Create the inital form Post Data
        var postData = new FormData();
        postData.append("name", $("#album_name").val());
        postData.append("description", $("#album_description").val());

        // If an album is being modified, then the hidden input field album_id will
        // have the ID of the album to modify.  Otherwise, create a new album.
        var endpoint = "/ImageUpload/";
        if (Number.isInteger(parseInt($("#album_id").attr("value")))) {
            postData.append("id", $("#album_id").attr("value"));
            endpoint += "UpdateAlbum";
        } else {
            endpoint += "CreateAlbum";
        }

        // Post the form data to the Backend Controller and handle the response.
        PostAjax(endpoint, postData,
            function (data, status) {
                if (data) {
                    if (data.success === true) {
                        // Successfully created/edited the record.  If it's an existing record, there will
                        // be an existing HTML Element with a custom 'album_id' attribute.  Find the HTML
                        // element and update it's UI.  Otherwise, create a new HTML element to append to 
                        // the list
                        var element = $('li[album_id="' + data.album.id + '"]');
                        if (element.length > 0) {
                            // Update the HTML of the existing element
                            element.find(".nav-link").text(data.album.name);
                            element.find(".nav-link").attr("data-toggle", data.album.description);
                        } else {
                            // Create and append element to DOM
                            element = create_album_list_item(data.album.id, data.album.name, data.album.description);
                            $(".nav-list").append(element);
                        }
                    } else {
                        display_error("album_error", "Unable to Save Album");
                    }
                }

                // And finally hide the web form.
                toggle_album_form(false, null);
            },
            function (xhr, status, response) {
                display_error("album_error", "An error occurred saving the album");
                toggle_album_form(false, null);
            });
    });
    // Handle Cancelling the Adding/Editing Submission process
    $("#cancel_album").on("click", function (evt) {
        toggle_album_form(false, null);
    });
    // ------------------------- END ALBUM PANEL UI EVENTS ---------------------

    // ------------------------- IMAGE PANEL UI EVENTS -------------------------
    // Event fires after a user selects an image in the browse dialog that pops up.
    // Possibility of getting 0-N files, however, we'll only accept one.  If there
    // is one valid image file, display a preview of the image and the meta data form
    $("#upload-file").on("change", function () {
        var file_array = $("#upload-file").prop('files');
        var valid = _validate_files(file_array);

        if (valid.success === true) {
            toggle_image_meta_form(file_array[0]);
            toggle_upload_controls(false);
        } else {
            $('#image-file-name').attr("placeholder", "");
            display_error("image_error", valid.msg);
        }

    });
    // Event fires when the user has a draggable item, has moused over this control,
    // and released ('dropped') the mouse button.  At this point, we have not uploaded
    // the file yet, but we have the binary data that we can use to display a preview image
    // Display the image and meta data form.
    $("#drop-zone").on("drop", function (evt) {
        evt.preventDefault();

        var file_array = evt.originalEvent.dataTransfer.files;
        var valid = _validate_files(evt.originalEvent.dataTransfer.files);

        if (valid.success === true) {
            toggle_image_meta_form(evt.originalEvent.dataTransfer.files[0]);
            toggle_upload_controls(false);
        } else {
            $("#drop-zone").removeClass('drop');
            display_error("image_error", valid.msg);
        }
    });
    // Event fires when user drags a droppable item over the control.  Need to prevent
    // the default action from happening otherwise we'll lose the data in the transfer object
    // Also adds a 'drop' class to the element to give it a visual indicator
    $("#drop-zone").on("dragover", function (evt) {
        $("#drop-zone").addClass('drop');
        evt.preventDefault();
    });
    // Event fires when a user is dragging an item and leaves the bounds of the control.
    // Just need to remove the visual indicator.
    $("#drop-zone").on("dragleave", function (evt) {
        $("#drop-zone").removeClass('drop');
        evt.preventDefault();
    });
    // Event fires when user clicks on the Upload Button.  This method will:
    // 1.  Validate Form Fields - Image has already been validated on drop/change. 
    // 2.  If there are invalid fields, report and cancel submission
    // 3.  Save Meta Data to DB (New Image or Update Existing Image)
    // 4.  Upload Image to Web Directory
    $("#submit_upload").on("click", function (evt) {
        // Validate the form using the JQuery validation plugin
        if ($("#image_upload_form").valid()) {

            // Validation passed, so make sure we clear all errors.
            clear_validation("#image_upload_form");

            // Create a FormData object to house the key/value pair for form data
            // Supporting the ability to upload multiples, however, the UI is 
            // Currently only supporting uploading 1 image at a time
            var postData = new FormData();
            postData.append("id", $("#meta_image_id").attr("value"));
            postData.append("albumID", $("#meta_album").val());
            postData.append("name", $("#meta_file_name").val());
            postData.append("description", $("#meta_file_description").val());
            postData.append("tags", $("#meta_file_tags").val());

            var files = $("#upload-file").prop("files");
            for (var i = 0; i < files.length; i++) {
                postData.append("file" + i, files[i]);
            }

            UploadImage($("#image_upload_form"), postData);
        }
    });
    // Handle Cancelling the upload of the file. 
    $("#cancel_upload").on("click", function (evt) {
        toggle_image_meta_form(null);
        toggle_upload_controls(true);
    });
    // Handle Cancelling the upload of the file. 
    $("#finish_upload").on("click", function (evt) {
        toggle_image_meta_form(null);
        toggle_upload_controls(true);
    });
    // ------------------------- END IMAGE PANEL UI EVENTS ---------------------

    // ------------------------- IMAGE GALLERY UI EVENTS -----------------------
    // Event fires when a user mouses into an image, display an overlay allowing them to delete image
    $(".gallery_image").on("mouseenter", function (evt) {
        console.log("MouseEnter");
        $(this).addClass("edit");
        if ($(this).find("#delete_image_btn").length <= 0)
            $(this).find("figure").append("<button id='delete_image_btn'><span class='glyphicon glyphicon-trash'></span></button>");
    });
    // Event fires when a user mouses out of an image, remove overlay 
    $(".gallery_image").on("mouseleave", function (evt) {
        console.log("MouseLeave");
        $(this).removeClass("edit");
        if ($(this).find("#delete_image_btn").length > 0)
            $(this).find("#delete_image_btn").remove();

    });
    // Event fires when user clicks on the delete button in the overlay
    $(document).on('click', '#gallery_panel .glyphicon-trash', function () {
        // Delete Glyph - glyphicon-trash
        DisplayConfirmation("Confirm Image Delete?",
            "Are you Sure you want to delete this image?",
            function (confirmed, image_id) {
                if (confirmed) {
                    if (Number.isInteger(parseInt(image_id))) {

                        var post_data = new FormData();
                        post_data.append("id", parseInt(image_id));

                        PostAjax("/ImageUpload/DeleteImage", post_data,
                            function (data, status) {
                                if (data.success === true) {
                                    var element = $('figure[image_id="' + data.image_id + '"]');
                                    element.remove();
                                } else {
                                    display_error("gallery_error", data.response);
                                }
                            },
                            function () {
                                display_error("gallery_error", "Error Deleting Image");
                            }
                        );
                    } else {
                        display_error("gallery_error", "Unable to Delete Album.  Invalid ID [" + image_id + "");
                    }
                }
            },
            $(this).closest("figure").attr('image_id'));
    });
    // ------------------------- END IMAGE GALLERY UI EVENTS -------------------

    // ------------------------- Show/Hide UI Elements -------------------------
    /// <summary>
    /// Shows or Hides the controls to upload an image
    /// </summary>
    /// <param name="display">The display.</param>
    function toggle_album_form(display, album_info) {
        clear_validation("#album_form");

        if (display === true) {
            if (!album_info) {
                // Incoming info is null, create new album
                $("#submit_album").text("Create");
            } else {
                // Incoming info has data, edit album
                $("#submit_album").text("Update");

                $("#album_id").attr("value", album_info.id);
                $("#album_name").val(album_info.name);
                $("#album_description").val(album_info.description);
            }

            $("#album_info").show("hidden");
            $("#album_list").hide("hidden");
        } else {
            $("#album_id").attr("value", "");
            $("#album_name").val("");
            $("#album_description").val("");

            $("#album_info").hide();
            $("#album_list").show();
        }
    }
    /// <summary>
    /// Shows or hides the meta data form for adding a new image
    /// </summary>
    /// <param name="image_info">The image information.</param>
    function toggle_image_meta_form(image_info) {

        clear_validation("#image_upload_form");

        if (image_info !== null) {
            $("#meta_data").show();
            $("#meta_image_id").attr("value", "");
            $("#meta_file_name").val(image_info.name);

            var imgReader = new FileReader();
            imgReader.onload = function (e) {
                $('#preview_image').attr('src', e.target.result);
            };
            imgReader.readAsDataURL(image_info);

        } else {
            $("#meta_data").hide();
            $("#meta_image_id").attr("value", "");
            $("#meta_album option[value='1']").prop('selected', true);
            $("#meta_file_name").val("");
            $('#preview_image').attr('src', "#");

            $("#image_upload_form").find(".progress").hide();

            $("#submit_upload").show();
            $("#cancel_upload").show();
            $("#finish_upload").hide();
        }
        $("#meta_file_description").val("");
        $("#meta_file_tags").val("");
    }
    /// <summary>
    /// Method used to show or hide a bootstrap panel container.  Requires
    /// an element with a '.collapse' selector, and must be contained within 
    /// a bootstrap panel container (.panel).  Will hide the panels panel-body
    /// and panel-footer if they are shown.  If they are hidden it will show them.
    /// </summary>
    /// <param name="collapse_btn">Reference to the panel toggle element</param>
    function toggle_panel(collapse_btn) {

        var parent_panel = collapse_btn.closest(".panel");
        if (!parent_panel) {
            console.log("Could not find parent element");
        }

        if (collapse_btn.hasClass("glyphicon-collapse-up")) {
            // Panel is currently Open.  Close it.
            // Hide all panel parts body and footer
            parent_panel.children(".panel-body").hide();
            parent_panel.children(".panel-footer").hide();

            // Swap out dropdown
            collapse_btn.removeClass("glyphicon-collapse-up");
            collapse_btn.addClass("glyphicon-collapse-down");
        } else {
            // Panel is currently Closed.  Open it.
            // Show all panel parts body and footer
            $(parent_panel).children(".panel-body").show();
            parent_panel.children(".panel-footer").show();

            // Swap out dropdown
            collapse_btn.addClass("glyphicon-collapse-up");
            collapse_btn.removeClass("glyphicon-collapse-down");
        }
    }
    /// <summary>
    /// Shows or Hides the controls to upload an image
    /// </summary>
    /// <param name="display">The display.</param>
    function toggle_upload_controls(display) {
        if (display === true) {
            $("#browse-file").show();
            $("#drop-zone").show();
        } else {
            $("#browse-file").hide();
            $("#drop-zone").hide();
        }
    }
    /// <summary>
    /// Clears any validation errors for the given form ID
    /// </summary>
    /// <param name="form_id">The ID of the form</param>
    function clear_validation(form_id) {
        $(form_id).find("label.error").remove();
    }
    /// <summary>
    /// Displays an error message to the user
    /// </summary>
    /// <param name="div">The div.</param>
    /// <param name="msg">The MSG.</param>
    function display_error(div, msg) {
        $("#" + div).show();
        $("#" + div + " > span").html(msg);
    }
    // ------------------------- End Show/Hide UI Elements ---------------------
    /// <summary>
    /// Method used to validate the file chosen by the user.  This validation occurs
    /// before the image is uploaded.
    /// </summary>
    /// <param name="file_array">The file array.</param>
    function _validate_files(file_array) {
        var retVal = {
            success: true,
            msg: ""
        };

        if (file_array.length > 1) {
            retVal.success = false;
            retVal.msg = "Only one file can be uploaded at a time";
        }

        var fileExtension = ['jpeg', 'jpg', 'png', 'gif', 'bmp'];
        if ($.inArray(file_array[0].name.split('.').pop().toLowerCase(), fileExtension) === -1) {
            retVal.success = false;
            retVal.msg = "Only formats are allowed : " + fileExtension.join(', ');
        }
        return retVal;
    }
    /// <summary>
    /// Method will create and return DOM Objects for a list item in the list of albums.
    /// </summary>
    /// <param name="album_id">The album identifier.</param>
    /// <param name="album_name">Name of the album.</param>
    /// <param name="album_description">The album description.</param>
    /// <returns>A DOM Object repesenting a new <li></li> item to be appended to the list of albums</returns>
    function create_album_list_item(album_id, album_name, album_description) {
        var list_item = $("<li/>");
        list_item.addClass("nav-item clearfix");
        list_item.attr("album_id", album_id);

        var album_label = $("<div/>");
        album_label.addClass("pull-left");

        var album_control = $("<div/>");
        album_control.addClass("pull-right");

        var album_link = $("<a/>");
        album_link.addClass("nav-link");
        album_link.attr("data-toggle", album_description);
        album_link.attr("href", "Album/" + album_id);
        album_link.text(album_name);

        var edit_control = $("<i/>");
        edit_control.addClass("album_control glyphicon glyphicon-cog");
        edit_control.css('padding-right', '4px');

        var delete_control = $("<i/>");
        delete_control.addClass("album_control glyphicon glyphicon-trash");

        album_label.append(album_link);

        album_control.append(edit_control);
        album_control.append(delete_control);

        list_item.append(album_label);
        list_item.append(album_control);

        return list_item;
    }
});



