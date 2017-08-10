using ImageUpload.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace ImageUpload.Models
{
    public class ImageAsset
    {
        public int ID { get; set; }
        public Album Album { get; set; }

        public string Name { get; set; }
        public string Description { get; set; }
        public ICollection<ImageTag> Tags { get; set; }
        public DateTime Created { get; set; }

        public DateTime Updated { get; set; }

        public String Location { get; set; }

        public static async Task<ImageAsset> Create(DBContext context, ImagePostData post_data)
        {
            ImageAsset newImage = null;
            try
            {
                newImage = new ImageAsset();
                newImage.Album = context.Albums.Find(post_data.AlbumID);
                newImage.Name = post_data.Name;
                newImage.Description = post_data.Description;
                newImage.Location = post_data.Location;

                newImage.Tags = new List<ImageTag>();
                if (!string.IsNullOrEmpty(post_data.Tags))
                {
                    foreach (string tag in post_data.Tags.Split(' '))
                        newImage.Tags.Add(new ImageTag() { Tag = tag, Created = DateTime.Now, Updated = DateTime.Now });
                    
                }
                newImage.Created = DateTime.Now;
                newImage.Updated = DateTime.Now;

                context.Add(newImage);
                await context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
            return newImage;
        }

        public static async Task<bool> Delete(DBContext context, int primary_id, string root_directory)
        {
            bool retVal = false;
            try
            {
                // Make sure it actually exists
                ImageAsset delete_image = context.ImageAssets.Find(primary_id);
                if (delete_image != null)
                {
                    IQueryable<ImageTag> tags = context.ImageTags.Where(t => t.ImageAsset.ID == primary_id);
                    foreach(ImageTag tag in tags)
                    {
                        context.ImageTags.Remove(tag);
                    }
                    context.ImageAssets.Remove(delete_image);
                    string image_location = delete_image.Location.Replace("/", "\\");

                    root_directory = root_directory.TrimStart(Path.DirectorySeparatorChar);
                    root_directory = root_directory.TrimStart(Path.AltDirectorySeparatorChar);

                    if (File.Exists(root_directory + "\\" + image_location))
                        File.Delete(root_directory + "\\" + image_location);

                    if (await context.SaveChangesAsync() > 0)
                        retVal = true;
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
                retVal = false;
            }
            return retVal;
        }
    }
}
