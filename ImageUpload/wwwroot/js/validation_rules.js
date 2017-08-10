
$(function () {
    $("#image_upload_form").validate({
        desc_maxlength: 1000,
        tags_maxlength: 500,
        rules: {
            meta_album: "required",
            meta_file_name: "required",
            meta_file_description: {
                required: true,
                maxlength: this.desc_maxlength
            },
            meta_file_tags: {
                required: false,
                maxlength: this.tags_maxlength
            }
        },
        messages: {
            meta_album: "Please select an album for the image",
            meta_file_name: "Please enter a name for the image.",
            meta_file_description: {
                required: "Please enter a description.",
                maxlength: "Description exceeds the " + this.desc_maxlength + " character maximum"
            },
            meta_file_tags: { maxlength: "Tags exceeds the " + this.tags_maxlength + " character maximum" }
        }
    });

    $("#album_form").validate({
        name_maxlength: 100,
        desc_maxlength: 500,
        rules: {
            album_name: {
                required: true,
                maxlength: this.name_maxlength
            },
            album_description: {
                required: false,
                maxlength: this.tags_maxlength
            }
        },
        messages: {
            album_name: "Please enter a name for the album.",
            album_description: {
                required: "Please enter a description.",
                maxlength: "Description exceeds the " + this.description_maxlength + " character maximum"
            }
        }
    });
});