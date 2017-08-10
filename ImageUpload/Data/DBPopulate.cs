using ImageUpload.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ImageUpload.Data
{
    public static class DBPopulate
    {
        public static void Initialize(DBContext context)
        {
            context.Database.EnsureCreated();
            
            if (context.Albums.Any())
            {
                // Already Populated
                return;   
            }

            var albums = new Album[]
            {
                new Album { Name         = "Default Album",
                            Description  = "Default Album to put images.",
                            Created      = DateTime.Now,Updated=DateTime.Now,
                            Default      = true },
                new Album { Name         = "Personal Album",
                            Description  = "Personal Album to put images.",
                            Created      = DateTime.Now,
                            Updated      = DateTime.Now },
                new Album { Name            = "Public Album",
                            Description    ="Public Album to put images.",
                            Created =DateTime.Now,
                            Updated =DateTime.Now}
            };
            foreach (Album album in albums)
            {
                context.Albums.Add(album);
            }
            context.SaveChanges();
        }
    }
}
