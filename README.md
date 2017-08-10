# ImageUpload
Coding project demonstrating how a user would upload an image as an attachment.  This application leverages a mix of ASP.NET MVC routing as well as async ajax calls to minimize page flips.  MVC routing is used to get the user to the page and feed it an Album ID.  The Album ID dictates which images to display.  If an Album ID is not provided, the application will find the Album marked as default in the DB.  JQuery ajax calls are then used to marshall data back and forth between the MVC controller and the UI.  Application is also using the Entity Framework for data persistence.  

![Example](/screenshot/splash.png)

## Available Routes
- http://localhost:52785/
- http://localhost:52785/ImageUpload/Index
- http://localhost:52785/ImageUpload/Index/<Album_ID>

## Dependencies
- Bower Package Dependencies
  - [bootstrap v3.3.7](http://getbootstrap.com/getting-started/#download)
  - [jquery v3.2.1](https://jquery.org/)
  - [jquery-ui v1.12.1](http://jqueryui.com)
  - [jquery-validation v1.14.0](https://jqueryvalidation.org)

## Schema
Albums
```
CREATE TABLE [dbo].[Albums] (
    [ID]          INT            IDENTITY (1, 1) NOT NULL,
    [Created]     DATETIME2 (7)  NOT NULL,
    [Default]     BIT            NOT NULL,
    [Description] NVARCHAR (MAX) NULL,
    [Name]        NVARCHAR (MAX) NULL,
    [Updated]     DATETIME2 (7)  NOT NULL,
    CONSTRAINT [PK_Albums] PRIMARY KEY CLUSTERED ([ID] ASC)
);
```

ImageAsset
```
CREATE TABLE [dbo].[ImageAssets] (
    [ID]          INT            IDENTITY (1, 1) NOT NULL,
    [AlbumID]     INT            NULL,
    [Created]     DATETIME2 (7)  NOT NULL,
    [Description] NVARCHAR (MAX) NULL,
    [Location]    NVARCHAR (MAX) NULL,
    [Name]        NVARCHAR (MAX) NULL,
    [Updated]     DATETIME2 (7)  NOT NULL,
    CONSTRAINT [PK_ImageAssets] PRIMARY KEY CLUSTERED ([ID] ASC),
    CONSTRAINT [FK_ImageAssets_Albums_AlbumID] FOREIGN KEY ([AlbumID]) REFERENCES [dbo].[Albums] ([ID])
);


GO
CREATE NONCLUSTERED INDEX [IX_ImageAssets_AlbumID]
    ON [dbo].[ImageAssets]([AlbumID] ASC);


```

ImageTags
```
CREATE TABLE [dbo].[ImageTags] (
    [ID]           INT            IDENTITY (1, 1) NOT NULL,
    [Created]      DATETIME2 (7)  NOT NULL,
    [ImageAssetID] INT            NULL,
    [Tag]          NVARCHAR (MAX) NULL,
    [Updated]      DATETIME2 (7)  NOT NULL,
    CONSTRAINT [PK_ImageTags] PRIMARY KEY CLUSTERED ([ID] ASC),
    CONSTRAINT [FK_ImageTags_ImageAssets_ImageAssetID] FOREIGN KEY ([ImageAssetID]) REFERENCES [dbo].[ImageAssets] ([ID])
);


GO
CREATE NONCLUSTERED INDEX [IX_ImageTags_ImageAssetID]
    ON [dbo].[ImageTags]([ImageAssetID] ASC);


```
