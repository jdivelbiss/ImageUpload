using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ImageUpload.Models;
using ImageUpload.Data;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Dynamic;
using Microsoft.AspNetCore.Http;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace ImageUpload.Controllers
{
    public class ImageUploadController : Controller
    {
        private readonly DBContext _context;
        private readonly IHostingEnvironment _environment;
        private readonly Settings _settings;

        public ImageUploadController(IOptions<Settings> settings, IHostingEnvironment environment, DBContext context)
        {
            _context = context;
            _environment = environment;
            _settings = settings.Value;
        }
        public async Task<IActionResult> Index(int id)
        {
            ViewData["AlbumList"] = await _context.Albums.ToListAsync();
            ViewData["ImageList"] = new List<ImageAsset>();
            
            if (id > 0)
            {
                ViewData["CurrentAlbum"] = _context.Albums.Find(id);
                var imageAssets = _context.ImageAssets.Where<ImageAsset>(i => i.Album.ID == id);
                if (imageAssets != null)
                    ViewData["ImageList"] = imageAssets.ToList();
            }
            else
            {
                ViewData["CurrentAlbum"] = _context.Albums.FirstOrDefault(a => a.Default == true);
                var imageAssets = _context.ImageAssets.Where<ImageAsset>(i => i.Album.Default == true);
                if (imageAssets != null)
                    ViewData["ImageList"] = imageAssets.ToList();
            }
            return View("Index");
        }

        #region Ajax Endpoints

        #region Album Methods
        [HttpPost]
        public async Task<IActionResult> CreateAlbum(AlbumPostData postData)
        {
            dynamic retVal = new ExpandoObject();
            retVal.album = await Album.Create(_context, postData);
            retVal.success = retVal.album != null;
            return Json(retVal);
        }

        [HttpPost]
        public async Task<IActionResult> UpdateAlbum(AlbumPostData post_data)
        {
            dynamic retVal = new ExpandoObject();
            retVal.album = await Album.Update(_context, this, post_data);
            retVal.success = retVal.album != null;
            return Json(retVal);
        }

        [HttpPost]
        public async Task<IActionResult> DeleteAlbum(AlbumPostData post_data)
        {
            dynamic retVal = new ExpandoObject();
            retVal.success = await Album.Delete(_context, post_data.ID);
            retVal.album_id = post_data.ID;
            if(!retVal.success) 
                retVal.response = string.Format("Unable to Delete Album ID [{0}].", post_data.ID);
            return Json(retVal);
        }
        #endregion

        #region Image Methods
        [HttpPost]
        public async Task<IActionResult> CreateImage(ImagePostData postData)
        {
            dynamic retVal = new ExpandoObject();
            try
            {
                retVal.success = true;

                // Validate incoming data, and make sure everything is proper
                // Check for:
                // Album - Ensure it exists in the collection
                //       - Ensure a folder in _upload_directory exists, if not, create
                // Image - Is less than the Max File Size
                //       - Doesn't already exist in the Album folder

                Album album = _context.Albums.Find(postData.AlbumID);
                if (album == null)
                {
                    // Need an album, if one was not found, retun an error and let the user know
                    retVal.success = false;
                    retVal.response = string.Format("Unable to find an Album with ID [{0}]", postData.AlbumID);
                    return retVal;
                }

                string album_directory = Path.Combine(_environment.WebRootPath, _settings.UploadDirectoryName, album.Name);
                if (!Directory.Exists(album_directory))
                    Directory.CreateDirectory(album_directory);


                // Support for uploading multiple, but UI only allows 1 at a time
                foreach (var upload_file in Request.Form.Files)
                {
                    if (upload_file.Length < _settings.MaxUploadSize)
                    {
                        string image_path = Path.Combine(album_directory, Path.GetFileName(upload_file.FileName));
                        if (!System.IO.File.Exists(image_path))
                        {
                            using (var stream = new FileStream(image_path, FileMode.Create))
                            {
                                await upload_file.CopyToAsync(stream);

                                postData.Location = string.Format("/{0}/{1}/{2}", _settings.UploadDirectoryName, album.Name, Path.GetFileName(upload_file.FileName));
                                // Call the Create Method on the ImageAsset Model, it will return it's new instance
                                ImageAsset newImage = await ImageAsset.Create(_context, postData);
                                retVal.image_id = newImage.ID;
                                retVal.image_location = newImage.Location;
                                retVal.image_name = newImage.Name;
                                retVal.image_desc = newImage.Description;
                            }
                        }
                        else
                        {
                            retVal.success = false;
                            retVal.response = string.Format("Image already exists [{0}]", image_path);
                            break;
                        }
                    }
                    else
                    {
                        retVal.success = false;
                        retVal.response = string.Format("Image Exceeds {0}mb", _settings.MaxUploadSize / 1024 / 1024);
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
                retVal.success = false;
                retVal.response = string.Format("Error Uploading : {0}", ex.Message);
            }

            return Json(retVal);
        }
        [HttpPost]
        public async Task<IActionResult> DeleteImage(ImagePostData post_data)
        {
            dynamic retVal = new ExpandoObject();

            retVal.success = await ImageAsset.Delete(_context, post_data.ID, _environment.WebRootPath);
            retVal.image_id = post_data.ID;

            if (!retVal.success)
                retVal.response = string.Format("Unable to Delete Image ID [{0}].", post_data.ID);
            return Json(retVal);
        }
        #endregion

        #endregion
    }
}
