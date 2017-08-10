using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ImageUpload.Data
{
    public class ImagePostData
    {
        public int ID { get; set; }
        public int AlbumID { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Tags { get; set; }
        public string Location { get; set; }
        public List<IFormFile> ImageFile { get; set; }
    }
}
