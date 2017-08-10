using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ImageUpload.Models
{
    public class ImageTag
    {
        public int ID { get; set; }

        public string Tag { get; set; }

        public DateTime Created { get; set; }

        public DateTime Updated { get; set; }

        public ImageAsset ImageAsset { get; set; }
    }
}
