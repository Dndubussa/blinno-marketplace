import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileAudio, FileVideo, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CategoryFieldsProps {
  category: string;
  attributes: Record<string, any>;
  onChange: (attributes: Record<string, any>) => void;
  userId: string;
}

const clothesSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const shoeSizes = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
const colors = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Orange", "Brown", "Gray", "Navy"];
const materials = ["Cotton", "Polyester", "Silk", "Wool", "Linen", "Leather", "Denim", "Nylon"];

export default function CategoryFields({ category, attributes, onChange, userId }: CategoryFieldsProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const updateAttribute = (key: string, value: any) => {
    onChange({ ...attributes, [key]: value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size validation (100MB max for most files, 500MB for videos)
    const maxSize = fieldName.includes('video') || fieldName === 'videoFile' ? 500 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSize / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    // Extract file extension, handling files without extensions
    const fileParts = file.name.split('.');
    const fileExt = fileParts.length > 1 
      ? fileParts.pop()?.toLowerCase() || 'bin'  // Use 'bin' as fallback if pop() somehow returns undefined
      : 'bin';  // No extension found, use 'bin' as default
    
    // Validate fileExt is not undefined or empty
    const validExt = fileExt && fileExt.length > 0 ? fileExt : 'bin';
    const fileName = `${userId}/${Date.now()}.${validExt}`;

    try {
      const { data, error } = await supabase.storage
        .from('product-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload file. Please try again.",
          variant: "destructive",
        });
      } else {
        const { data: urlData } = supabase.storage
          .from('product-files')
          .getPublicUrl(fileName);
        
        updateAttribute(fieldName, urlData.publicUrl);
        toast({
          title: "File uploaded",
          description: "Your file has been uploaded successfully.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeFile = (fieldName: string) => {
    updateAttribute(fieldName, null);
  };

  // Clothes category fields
  if (category === "Clothes") {
    return (
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium text-sm text-muted-foreground">Fashion Details</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sizes Available</Label>
            <div className="flex flex-wrap gap-2">
              {clothesSizes.map((size) => (
                <Button
                  key={size}
                  type="button"
                  size="sm"
                  variant={(attributes.sizes || []).includes(size) ? "default" : "outline"}
                  onClick={() => {
                    const current = attributes.sizes || [];
                    const updated = current.includes(size)
                      ? current.filter((s: string) => s !== size)
                      : [...current, size];
                    updateAttribute("sizes", updated);
                  }}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Colors Available</Label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {colors.map((color) => (
                <Button
                  key={color}
                  type="button"
                  size="sm"
                  variant={(attributes.colors || []).includes(color) ? "default" : "outline"}
                  onClick={() => {
                    const current = attributes.colors || [];
                    const updated = current.includes(color)
                      ? current.filter((c: string) => c !== color)
                      : [...current, color];
                    updateAttribute("colors", updated);
                  }}
                >
                  {color}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Material</Label>
            <Select
              value={attributes.material || ""}
              onValueChange={(v) => updateAttribute("material", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <Select
              value={attributes.gender || ""}
              onValueChange={(v) => updateAttribute("gender", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="unisex">Unisex</SelectItem>
                <SelectItem value="kids">Kids</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  // Electronics category fields
  if (category === "Electronics") {
    return (
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium text-sm text-muted-foreground">Electronics Specifications</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Brand</Label>
            <Input
              value={attributes.brand || ""}
              onChange={(e) => updateAttribute("brand", e.target.value)}
              placeholder="e.g., Samsung, Apple"
            />
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
            <Input
              value={attributes.model || ""}
              onChange={(e) => updateAttribute("model", e.target.value)}
              placeholder="e.g., Galaxy S24"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Warranty (months)</Label>
            <Input
              type="number"
              value={attributes.warranty || ""}
              onChange={(e) => updateAttribute("warranty", e.target.value)}
              placeholder="e.g., 12"
            />
          </div>
          <div className="space-y-2">
            <Label>Condition</Label>
            <Select
              value={attributes.condition || ""}
              onValueChange={(v) => updateAttribute("condition", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="refurbished">Refurbished</SelectItem>
                <SelectItem value="used">Used</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Technical Specifications</Label>
          <Textarea
            value={attributes.specifications || ""}
            onChange={(e) => updateAttribute("specifications", e.target.value)}
            placeholder="Enter key specifications (e.g., RAM, Storage, Display size...)"
            rows={3}
          />
        </div>
      </div>
    );
  }

  // Books category fields
  if (category === "Books") {
    return (
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium text-sm text-muted-foreground">Book Details</h4>
        
        <div className="space-y-2">
          <Label>Book Title *</Label>
          <Input
            value={attributes.bookTitle || ""}
            onChange={(e) => updateAttribute("bookTitle", e.target.value)}
            placeholder="Enter book title"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Author</Label>
            <Input
              value={attributes.author || ""}
              onChange={(e) => updateAttribute("author", e.target.value)}
              placeholder="Author name"
            />
          </div>
          <div className="space-y-2">
            <Label>ISBN</Label>
            <Input
              value={attributes.isbn || ""}
              onChange={(e) => updateAttribute("isbn", e.target.value)}
              placeholder="ISBN number"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Format</Label>
            <Select
              value={attributes.format || ""}
              onValueChange={(v) => updateAttribute("format", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ebook">E-Book (PDF/EPUB)</SelectItem>
                <SelectItem value="hardcover">Hardcover</SelectItem>
                <SelectItem value="paperback">Paperback</SelectItem>
                <SelectItem value="audiobook">Audiobook</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pages</Label>
            <Input
              type="number"
              value={attributes.pages || ""}
              onChange={(e) => updateAttribute("pages", e.target.value)}
              placeholder="Number of pages"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Publisher</Label>
          <Input
            value={attributes.publisher || ""}
            onChange={(e) => updateAttribute("publisher", e.target.value)}
            placeholder="Publisher name"
          />
        </div>

        {/* Book Cover Image Upload */}
        <div className="space-y-2">
          <Label>Book Cover Image</Label>
          {attributes.coverImage ? (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <img 
                src={attributes.coverImage} 
                alt="Cover" 
                className="h-16 w-12 object-cover rounded"
              />
              <span className="text-sm flex-1 truncate">Cover uploaded</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => removeFile("coverImage")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, "coverImage")}
              disabled={uploading}
            />
          )}
          <p className="text-xs text-muted-foreground">Upload a high-quality cover image for your book</p>
        </div>

        {/* E-Book File Upload - shown for all formats as optional, required for ebook */}
        <div className="space-y-2">
          <Label>
            {attributes.format === "ebook" ? "Upload E-Book File *" : "Digital Version (Optional)"}
          </Label>
          {attributes.ebookFile ? (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm flex-1 truncate">File uploaded</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => removeFile("ebookFile")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Input
              type="file"
              accept=".pdf,.epub,.mobi"
              onChange={(e) => handleFileUpload(e, "ebookFile")}
              disabled={uploading}
            />
          )}
          <p className="text-xs text-muted-foreground">
            Supported formats: PDF, EPUB, MOBI
          </p>
        </div>

        {/* Audiobook file for audiobook format */}
        {attributes.format === "audiobook" && (
          <div className="space-y-2">
            <Label>Upload Audiobook File *</Label>
            {attributes.audiobookFile ? (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileAudio className="h-5 w-5 text-primary" />
                <span className="text-sm flex-1 truncate">Audiobook uploaded</span>
                <Button type="button" size="icon" variant="ghost" onClick={() => removeFile("audiobookFile")}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Input
                type="file"
                accept=".mp3,.m4a,.wav,.aac"
                onChange={(e) => handleFileUpload(e, "audiobookFile")}
                disabled={uploading}
              />
            )}
            <p className="text-xs text-muted-foreground">
              Supported formats: MP3, M4A, WAV, AAC
            </p>
          </div>
        )}
      </div>
    );
  }

  // Music category fields
  if (category === "Music") {
    return (
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium text-sm text-muted-foreground">Music Details</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Artist/Band *</Label>
            <Input
              value={attributes.artist || ""}
              onChange={(e) => updateAttribute("artist", e.target.value)}
              placeholder="Artist or band name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Genre *</Label>
            <Select
              value={attributes.genre || ""}
              onValueChange={(v) => updateAttribute("genre", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pop">Pop</SelectItem>
                <SelectItem value="rock">Rock</SelectItem>
                <SelectItem value="hiphop">Hip Hop</SelectItem>
                <SelectItem value="rnb">R&B</SelectItem>
                <SelectItem value="jazz">Jazz</SelectItem>
                <SelectItem value="classical">Classical</SelectItem>
                <SelectItem value="electronic">Electronic</SelectItem>
                <SelectItem value="afrobeats">Afrobeats</SelectItem>
                <SelectItem value="bongo">Bongo Flava</SelectItem>
                <SelectItem value="reggae">Reggae</SelectItem>
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="blues">Blues</SelectItem>
                <SelectItem value="gospel">Gospel</SelectItem>
                <SelectItem value="folk">Folk</SelectItem>
                <SelectItem value="metal">Metal</SelectItem>
                <SelectItem value="punk">Punk</SelectItem>
                <SelectItem value="latin">Latin</SelectItem>
                <SelectItem value="world">World Music</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type *</Label>
            <Select
              value={attributes.musicType || ""}
              onValueChange={(v) => updateAttribute("musicType", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="album">Album</SelectItem>
                <SelectItem value="ep">EP</SelectItem>
                <SelectItem value="beat">Beat/Instrumental</SelectItem>
                <SelectItem value="mixtape">Mixtape</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Duration</Label>
            <Input
              value={attributes.duration || ""}
              onChange={(e) => updateAttribute("duration", e.target.value)}
              placeholder="e.g., 3:45 or 45 mins"
            />
          </div>
        </div>

        {/* Song Titles/Track Listing for Albums */}
        {(attributes.musicType === "album" || attributes.musicType === "ep" || attributes.musicType === "mixtape") && (
          <div className="space-y-2">
            <Label>Track Listing</Label>
            <Textarea
              value={attributes.trackListing || ""}
              onChange={(e) => updateAttribute("trackListing", e.target.value)}
              placeholder="Enter track titles, one per line:&#10;1. Song Title 1&#10;2. Song Title 2&#10;3. Song Title 3"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">List all songs/tracks in this release</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Release Date</Label>
            <Input
              type="date"
              value={attributes.releaseDate || ""}
              onChange={(e) => updateAttribute("releaseDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Record Label</Label>
            <Input
              value={attributes.recordLabel || ""}
              onChange={(e) => updateAttribute("recordLabel", e.target.value)}
              placeholder="Record label name (optional)"
            />
          </div>
        </div>

        {/* Album Cover Art Upload */}
        <div className="space-y-2">
          <Label>Album Cover Art *</Label>
          {attributes.albumCover ? (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <img 
                src={attributes.albumCover} 
                alt="Album cover" 
                className="h-20 w-20 object-cover rounded"
              />
              <span className="text-sm flex-1 truncate">Cover art uploaded</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => removeFile("albumCover")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, "albumCover")}
              disabled={uploading}
            />
          )}
          <p className="text-xs text-muted-foreground">Upload high-quality album cover art (recommended: 1000x1000px)</p>
        </div>

        {/* Audio File Upload */}
        <div className="space-y-2">
          <Label>Upload Audio File *</Label>
          {attributes.audioFile ? (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileAudio className="h-5 w-5 text-primary" />
              <span className="text-sm flex-1 truncate">Audio uploaded</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => removeFile("audioFile")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Input
              type="file"
              accept=".mp3,.wav,.flac,.aac,.m4a"
              onChange={(e) => handleFileUpload(e, "audioFile")}
              disabled={uploading}
            />
          )}
          <p className="text-xs text-muted-foreground">Supported formats: MP3, WAV, FLAC, AAC, M4A</p>
        </div>

        {/* Video File Upload (Music Video) */}
        <div className="space-y-2">
          <Label>Music Video (Optional)</Label>
          {attributes.videoFile ? (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileVideo className="h-5 w-5 text-primary" />
              <span className="text-sm flex-1 truncate">Video uploaded</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => removeFile("videoFile")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Input
              type="file"
              accept=".mp4,.webm,.mov,.avi"
              onChange={(e) => handleFileUpload(e, "videoFile")}
              disabled={uploading}
            />
          )}
          <p className="text-xs text-muted-foreground">Upload music video (formats: MP4, WebM, MOV, AVI)</p>
        </div>

        {/* Preview Audio */}
        <div className="space-y-2">
          <Label>Preview Audio (Optional)</Label>
          {attributes.previewFile ? (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileAudio className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm flex-1 truncate">Preview uploaded</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => removeFile("previewFile")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Input
              type="file"
              accept=".mp3,.wav"
              onChange={(e) => handleFileUpload(e, "previewFile")}
              disabled={uploading}
            />
          )}
          <p className="text-xs text-muted-foreground">Short preview clip (30-60 seconds) for potential buyers</p>
        </div>
      </div>
    );
  }

  // Courses category fields
  if (category === "Courses") {
    return (
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium text-sm text-muted-foreground">Course Details</h4>
        
        <div className="space-y-2">
          <Label>Course Title *</Label>
          <Input
            value={attributes.courseTitle || ""}
            onChange={(e) => updateAttribute("courseTitle", e.target.value)}
            placeholder="Enter course title"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Instructor Name</Label>
            <Input
              value={attributes.instructor || ""}
              onChange={(e) => updateAttribute("instructor", e.target.value)}
              placeholder="Course instructor"
            />
          </div>
          <div className="space-y-2">
            <Label>Skill Level</Label>
            <Select
              value={attributes.skillLevel || ""}
              onValueChange={(v) => updateAttribute("skillLevel", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="all">All Levels</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Duration (hours)</Label>
            <Input
              type="number"
              value={attributes.courseDuration || ""}
              onChange={(e) => updateAttribute("courseDuration", e.target.value)}
              placeholder="e.g., 10"
            />
          </div>
          <div className="space-y-2">
            <Label>Number of Lessons</Label>
            <Input
              type="number"
              value={attributes.lessonsCount || ""}
              onChange={(e) => updateAttribute("lessonsCount", e.target.value)}
              placeholder="e.g., 25"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>What You'll Learn</Label>
          <Textarea
            value={attributes.learningOutcomes || ""}
            onChange={(e) => updateAttribute("learningOutcomes", e.target.value)}
            placeholder="Key learning outcomes, one per line..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Course Preview Video</Label>
          {attributes.previewVideo ? (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileVideo className="h-5 w-5 text-primary" />
              <span className="text-sm flex-1 truncate">Video uploaded</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => removeFile("previewVideo")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Input
              type="file"
              accept=".mp4,.webm,.mov"
              onChange={(e) => handleFileUpload(e, "previewVideo")}
              disabled={uploading}
            />
          )}
        </div>
      </div>
    );
  }

  // Art & Crafts category fields
  if (category === "Art & Crafts") {
    return (
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium text-sm text-muted-foreground">Artwork Details</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Medium</Label>
            <Select
              value={attributes.medium || ""}
              onValueChange={(v) => updateAttribute("medium", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select medium" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oil">Oil Painting</SelectItem>
                <SelectItem value="acrylic">Acrylic</SelectItem>
                <SelectItem value="watercolor">Watercolor</SelectItem>
                <SelectItem value="digital">Digital Art</SelectItem>
                <SelectItem value="sculpture">Sculpture</SelectItem>
                <SelectItem value="photography">Photography</SelectItem>
                <SelectItem value="textile">Textile/Fabric</SelectItem>
                <SelectItem value="mixed">Mixed Media</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Style</Label>
            <Input
              value={attributes.style || ""}
              onChange={(e) => updateAttribute("style", e.target.value)}
              placeholder="e.g., Abstract, Realism"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Width (cm)</Label>
            <Input
              type="number"
              value={attributes.width || ""}
              onChange={(e) => updateAttribute("width", e.target.value)}
              placeholder="Width"
            />
          </div>
          <div className="space-y-2">
            <Label>Height (cm)</Label>
            <Input
              type="number"
              value={attributes.height || ""}
              onChange={(e) => updateAttribute("height", e.target.value)}
              placeholder="Height"
            />
          </div>
          <div className="space-y-2">
            <Label>Depth (cm)</Label>
            <Input
              type="number"
              value={attributes.depth || ""}
              onChange={(e) => updateAttribute("depth", e.target.value)}
              placeholder="Depth (optional)"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Is this an original or print?</Label>
          <Select
            value={attributes.artType || ""}
            onValueChange={(v) => updateAttribute("artType", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">Original</SelectItem>
              <SelectItem value="limited">Limited Edition Print</SelectItem>
              <SelectItem value="print">Print</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // Perfumes category fields
  if (category === "Perfumes") {
    return (
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium text-sm text-muted-foreground">Fragrance Details</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Volume (ml)</Label>
            <Input
              type="number"
              value={attributes.volume || ""}
              onChange={(e) => updateAttribute("volume", e.target.value)}
              placeholder="e.g., 100"
            />
          </div>
          <div className="space-y-2">
            <Label>Concentration</Label>
            <Select
              value={attributes.concentration || ""}
              onValueChange={(v) => updateAttribute("concentration", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parfum">Parfum (Extrait)</SelectItem>
                <SelectItem value="edp">Eau de Parfum</SelectItem>
                <SelectItem value="edt">Eau de Toilette</SelectItem>
                <SelectItem value="edc">Eau de Cologne</SelectItem>
                <SelectItem value="body_mist">Body Mist</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Target Gender</Label>
            <Select
              value={attributes.fragranceGender || ""}
              onValueChange={(v) => updateAttribute("fragranceGender", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="unisex">Unisex</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Scent Family</Label>
            <Select
              value={attributes.scentFamily || ""}
              onValueChange={(v) => updateAttribute("scentFamily", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="floral">Floral</SelectItem>
                <SelectItem value="woody">Woody</SelectItem>
                <SelectItem value="oriental">Oriental</SelectItem>
                <SelectItem value="fresh">Fresh</SelectItem>
                <SelectItem value="citrus">Citrus</SelectItem>
                <SelectItem value="aquatic">Aquatic</SelectItem>
                <SelectItem value="spicy">Spicy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Textarea
            value={attributes.fragranceNotes || ""}
            onChange={(e) => updateAttribute("fragranceNotes", e.target.value)}
            placeholder="Top, middle, and base notes..."
            rows={2}
          />
        </div>
      </div>
    );
  }

  // Home Appliances & Kitchenware
  if (category === "Home Appliances" || category === "Kitchenware") {
    return (
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium text-sm text-muted-foreground">Product Specifications</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Brand</Label>
            <Input
              value={attributes.brand || ""}
              onChange={(e) => updateAttribute("brand", e.target.value)}
              placeholder="Brand name"
            />
          </div>
          <div className="space-y-2">
            <Label>Model Number</Label>
            <Input
              value={attributes.modelNumber || ""}
              onChange={(e) => updateAttribute("modelNumber", e.target.value)}
              placeholder="Model number"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Warranty (months)</Label>
            <Input
              type="number"
              value={attributes.warranty || ""}
              onChange={(e) => updateAttribute("warranty", e.target.value)}
              placeholder="e.g., 12"
            />
          </div>
          <div className="space-y-2">
            <Label>Power (Watts)</Label>
            <Input
              type="number"
              value={attributes.power || ""}
              onChange={(e) => updateAttribute("power", e.target.value)}
              placeholder="e.g., 1200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Dimensions (optional)</Label>
          <Input
            value={attributes.dimensions || ""}
            onChange={(e) => updateAttribute("dimensions", e.target.value)}
            placeholder="e.g., 30x20x15 cm"
          />
        </div>

        <div className="space-y-2">
          <Label>Key Features</Label>
          <Textarea
            value={attributes.features || ""}
            onChange={(e) => updateAttribute("features", e.target.value)}
            placeholder="List key features, one per line..."
            rows={3}
          />
        </div>
      </div>
    );
  }

  // Other category fields - generic customizable attributes
  if (category === "Other") {
    return (
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium text-sm text-muted-foreground">Additional Details</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Brand/Manufacturer</Label>
            <Input
              value={attributes.brand || ""}
              onChange={(e) => updateAttribute("brand", e.target.value)}
              placeholder="Brand or manufacturer name"
            />
          </div>
          <div className="space-y-2">
            <Label>Model/Item Number</Label>
            <Input
              value={attributes.modelNumber || ""}
              onChange={(e) => updateAttribute("modelNumber", e.target.value)}
              placeholder="Model or item number"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Condition</Label>
            <Select
              value={attributes.condition || ""}
              onValueChange={(v) => updateAttribute("condition", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="like_new">Like New</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Warranty</Label>
            <Input
              value={attributes.warranty || ""}
              onChange={(e) => updateAttribute("warranty", e.target.value)}
              placeholder="e.g., 1 year, 6 months"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Additional Specifications</Label>
          <Textarea
            value={attributes.specifications || ""}
            onChange={(e) => updateAttribute("specifications", e.target.value)}
            placeholder="Enter any additional specifications, features, or details..."
            rows={4}
          />
        </div>

        {/* Optional file upload for documentation/manuals */}
        <div className="space-y-2">
          <Label>Documentation/Manual (Optional)</Label>
          {attributes.documentationFile ? (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm flex-1 truncate">Document uploaded</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => removeFile("documentationFile")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileUpload(e, "documentationFile")}
              disabled={uploading}
            />
          )}
          <p className="text-xs text-muted-foreground">Upload product manual or documentation (PDF, DOC, DOCX)</p>
        </div>
      </div>
    );
  }

  // Default - no category-specific fields
  return null;
}