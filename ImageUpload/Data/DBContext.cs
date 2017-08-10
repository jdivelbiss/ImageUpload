using ImageUpload.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ImageUpload.Data
{
    public class DBContext : DbContext
    {
        public DBContext(DbContextOptions<DBContext> options) : base(options)
        {
        }

        public DbSet<Album> Albums { get; set; }
        public DbSet<ImageAsset> ImageAssets { get; set; }
        public DbSet<ImageTag> ImageTags { get; set; }
    }
}
