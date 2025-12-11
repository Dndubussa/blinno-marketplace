# Category-Specific Product Fields Implementation

## Overview
The product creation flow dynamically adapts based on the selected category, displaying category-specific fields, file upload options, and validation requirements.

## Categories and Their Fields

### 1. **Music** 🎵
**Required Fields:**
- Artist/Band *
- Genre * (Pop, Rock, Hip Hop, R&B, Jazz, Classical, Electronic, Afrobeats, Bongo Flava, Reggae, Country, Blues, Gospel, Folk, Metal, Punk, Latin, World Music, Other)
- Type * (Single, Album, EP, Beat/Instrumental, Mixtape)
- Album Cover Art * (Image upload)
- Audio File * (MP3, WAV, FLAC, AAC, M4A)

**Optional Fields:**
- Duration
- Track Listing (for Albums/EPs/Mixtapes)
- Release Date
- Record Label
- Music Video (MP4, WebM, MOV, AVI)
- Preview Audio (30-60 second clip)

**File Formats:**
- Audio: `.mp3`, `.wav`, `.flac`, `.aac`, `.m4a`
- Video: `.mp4`, `.webm`, `.mov`, `.avi`
- Images: All image formats for album cover

**File Size Limits:**
- Audio/Images: 100MB max
- Video: 500MB max

---

### 2. **Books** 📚
**Fields:**
- Author
- ISBN
- Format (E-Book PDF/EPUB, Hardcover, Paperback, Audiobook)
- Pages
- Publisher
- Book Cover Image
- E-Book File (PDF, EPUB, MOBI) - Required for ebook format
- Audiobook File (MP3, M4A, WAV, AAC) - Required for audiobook format

**File Formats:**
- E-Books: `.pdf`, `.epub`, `.mobi`
- Audiobooks: `.mp3`, `.m4a`, `.wav`, `.aac`
- Images: All image formats for cover

---

### 3. **Courses** 🎓
**Fields:**
- Instructor Name
- Skill Level (Beginner, Intermediate, Advanced, All Levels)
- Duration (hours)
- Number of Lessons
- What You'll Learn (Learning outcomes)
- Course Preview Video (MP4, WebM, MOV)

**File Formats:**
- Video: `.mp4`, `.webm`, `.mov`

---

### 4. **Clothes** 👕
**Fields:**
- Sizes Available (XS, S, M, L, XL, XXL, XXXL) - Multi-select
- Colors Available (Black, White, Red, Blue, Green, Yellow, Pink, Purple, Orange, Brown, Gray, Navy) - Multi-select
- Material (Cotton, Polyester, Silk, Wool, Linen, Leather, Denim, Nylon)
- Gender (Men, Women, Unisex, Kids)

---

### 5. **Electronics** 📱
**Fields:**
- Brand
- Model
- Warranty (months)
- Condition (New, Refurbished, Used)
- Technical Specifications (Textarea)

---

### 6. **Perfumes** 💨
**Fields:**
- Volume (ml)
- Concentration (Parfum/Extrait, Eau de Parfum, Eau de Toilette, Eau de Cologne, Body Mist)
- Target Gender (Men, Women, Unisex)
- Scent Family (Floral, Woody, Oriental, Fresh, Citrus, Aquatic, Spicy)
- Notes (Top, middle, and base notes)

---

### 7. **Art & Crafts** 🎨
**Fields:**
- Medium (Oil Painting, Acrylic, Watercolor, Digital Art, Sculpture, Photography, Textile/Fabric, Mixed Media, Other)
- Style (e.g., Abstract, Realism)
- Width (cm)
- Height (cm)
- Depth (cm) - Optional
- Art Type (Original, Limited Edition Print, Print)

---

### 8. **Home Appliances & Kitchenware** 🏠
**Fields:**
- Brand
- Model Number
- Warranty (months)
- Power (Watts)
- Dimensions (optional)
- Key Features (Textarea)

---

### 9. **Other** 📦
**Fields:**
- Brand/Manufacturer
- Model/Item Number
- Condition (New, Like New, Excellent, Good, Fair, Poor)
- Warranty
- Additional Specifications (Textarea)
- Documentation/Manual (PDF, DOC, DOCX) - Optional

---

## File Upload System

### Storage Bucket
- **Bucket Name**: `product-files`
- **Access**: Public read, authenticated write
- **File Organization**: Files stored as `{userId}/{timestamp}.{ext}`

### File Size Limits
- **Standard Files** (audio, images, documents): 100MB max
- **Video Files**: 500MB max

### Supported File Types by Category

| Category | File Types | Max Size |
|----------|-----------|----------|
| Music | Audio: MP3, WAV, FLAC, AAC, M4A<br>Video: MP4, WebM, MOV, AVI<br>Images: All formats | Audio/Images: 100MB<br>Video: 500MB |
| Books | PDF, EPUB, MOBI, MP3, M4A, WAV, AAC<br>Images: All formats | 100MB |
| Courses | MP4, WebM, MOV | 500MB |
| Other | PDF, DOC, DOCX | 100MB |

### Upload Validation
- File size validation before upload
- File type validation via `accept` attribute
- Error handling with user-friendly messages
- Upload progress indication

---

## Dynamic Field Rendering

The `CategoryFields` component:
1. Receives the selected category as a prop
2. Renders category-specific fields based on the category
3. Updates the `attributes` object with user input
4. Handles file uploads to Supabase Storage
5. Validates file types and sizes

### Component Flow
```
User selects category → CategoryFields component renders → 
User fills fields → Attributes stored in state → 
On submit → Attributes saved to products.attributes (JSONB)
```

---

## Data Storage

### Database Schema
- **Table**: `products`
- **Column**: `attributes` (JSONB)
- **Storage**: All category-specific data stored as JSON

### Example Music Product Attributes
```json
{
  "artist": "Artist Name",
  "genre": "afrobeats",
  "musicType": "album",
  "duration": "45 mins",
  "trackListing": "1. Song 1\n2. Song 2\n3. Song 3",
  "releaseDate": "2024-01-15",
  "recordLabel": "Label Name",
  "albumCover": "https://...",
  "audioFile": "https://...",
  "videoFile": "https://...",
  "previewFile": "https://..."
}
```

---

## Validation Rules

### Required Fields by Category

**Music:**
- Artist/Band
- Genre
- Type
- Album Cover Art
- Audio File

**Books:**
- E-Book File (if format is "ebook")
- Audiobook File (if format is "audiobook")

**All Categories:**
- Product Title (always required)
- Price (always required)
- Category (always required)

### File Validation
- File size checked before upload
- File type validated via browser `accept` attribute
- Error messages displayed for invalid files

---

## User Experience Features

1. **Dynamic Field Display**: Fields appear/disappear based on category selection
2. **File Preview**: Uploaded files show preview with remove option
3. **Progress Indication**: Upload state prevents duplicate uploads
4. **Error Handling**: Clear error messages for failed uploads
5. **File Management**: Users can remove and re-upload files
6. **Multi-select Options**: Sizes, colors, etc. use toggle buttons
7. **Conditional Fields**: Some fields only appear for specific types (e.g., track listing for albums)

---

## Future Enhancements

Potential improvements:
1. Drag-and-drop file uploads
2. Multiple file uploads for albums with multiple tracks
3. Image cropping for album covers
4. Audio/video preview players
5. File compression before upload
6. Progress bars for large file uploads
7. Batch upload for multiple products
8. Template saving for frequently used attributes

---

## Testing Checklist

- [x] Music category with all file types
- [x] Books category with ebook and audiobook formats
- [x] Courses category with video upload
- [x] File size validation
- [x] File type validation
- [x] Error handling
- [x] File removal functionality
- [x] Multi-select fields (sizes, colors)
- [x] Conditional fields (track listing for albums)
- [x] All categories render correctly
- [x] Attributes save to database correctly

---

## Notes

- Product images (gallery) are separate from category-specific file uploads
- Album cover art is stored in attributes, not in the main product images array
- File URLs are stored as public URLs from Supabase Storage
- All file uploads are authenticated (user must be logged in)
- Files are organized by user ID to prevent conflicts

