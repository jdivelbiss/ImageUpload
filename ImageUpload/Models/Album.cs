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
    public class Album
    {
        public int ID { get; set; }

        public string Name { get; set; }
        public string Description { get; set; }

        public DateTime Created { get; set; }

        public DateTime Updated { get; set; }

        public ICollection<ImageAsset> Images { get; set; }

        public bool Default { get; set; }


        public static async Task<Album> Create(DBContext context, AlbumPostData post_data)
        {
            Album newAlbum = null;

            try
            {
                // Check and make sure there's not an existing album with that name
                if (context.Albums.FirstOrDefault<Album>(a => a.Name == post_data.Name) != null)
                    return newAlbum;

                newAlbum = new Album();
                newAlbum.Name = post_data.Name;
                newAlbum.Description = post_data.Description;
                newAlbum.Created = DateTime.Now;
                newAlbum.Updated = DateTime.Now;

                context.Albums.Add(newAlbum);
                await context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
            return newAlbum;
        }


        public static async Task<Album> Update(DBContext context, Controller controller, AlbumPostData post_data)
        {
            Album update_album = null;
            try
            {
                // Make sure there's not an album with this name already
                if (context.Albums.FirstOrDefault<Album>(a => a.Name == post_data.Name && a.ID != post_data.ID) != null)
                    return update_album;

                update_album = await context.Albums.SingleOrDefaultAsync(A => A.ID == post_data.ID);

                update_album.Name = post_data.Name;
                update_album.Description = post_data.Description;
                update_album.Updated = DateTime.Now;
                

                if (await controller.TryUpdateModelAsync<Album>(update_album, "", a => a.Name, a => a.Description, a => a.Updated))
                {
                    try
                    {
                        await context.SaveChangesAsync();
                    }
                    catch (Exception ex)
                    {
                        Debug.WriteLine(ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
            return update_album;
        }
        public static async Task<bool> Delete(DBContext context, int album_id)
        {
            bool retVal = false;
            try
            {
                // Make sure it actually exists
                Album delete_album = context.Albums.Find(album_id);

                if (delete_album != null)
                {
                    context.Albums.Remove(delete_album);
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
