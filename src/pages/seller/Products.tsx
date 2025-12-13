import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import CategoryFields from "@/components/seller/CategoryFields";
import ImageGalleryUpload from "@/components/seller/ImageGalleryUpload";
import { SUPPORTED_CURRENCIES, Currency, CURRENCY_INFO } from "@/lib/currency";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency?: string;
  category: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  attributes?: Record<string, any> | null;
  images?: string[] | null;
}

const categories = [
  "Clothes",
  "Perfumes",
  "Home Appliances",
  "Kitchenware",
  "Electronics",
  "Books",
  "Art & Crafts",
  "Music",
  "Courses",
  "Other",
];

export default function Products() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    currency: "USD" as Currency,
    category: "",
    stock_quantity: "",
  });
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [productImages, setProductImages] = useState<string[]>([]);

  const fetchProducts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts((data || []).map(p => ({
        ...p,
        attributes: (typeof p.attributes === 'object' && p.attributes !== null) 
          ? p.attributes as Record<string, any>
          : {},
        images: p.images || [],
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Generate title and description from category-specific fields
    let productTitle = formData.title;
    let productDescription = formData.description || null;
    let productImagesData = productImages;

    if (formData.category === "Music") {
      // Generate title from artist and music type
      const artist = attributes.artist || "";
      const musicType = attributes.musicType || "";
      const musicTypeLabel = musicType === "single" ? "Single" : 
                            musicType === "album" ? "Album" : 
                            musicType === "ep" ? "EP" : 
                            musicType === "beat" ? "Beat" : 
                            musicType === "mixtape" ? "Mixtape" : "";
      
      productTitle = artist ? `${artist} - ${musicTypeLabel}` : musicTypeLabel;
      
      // Generate description from music attributes
      const genre = attributes.genre || "";
      const duration = attributes.duration || "";
      const releaseDate = attributes.releaseDate || "";
      const parts = [];
      if (genre) parts.push(`Genre: ${genre}`);
      if (duration) parts.push(`Duration: ${duration}`);
      if (releaseDate) parts.push(`Released: ${new Date(releaseDate).toLocaleDateString()}`);
      productDescription = parts.length > 0 ? parts.join(" | ") : null;
      
      // Use album cover as the product image if available
      if (attributes.albumCover) {
        productImagesData = [attributes.albumCover];
      } else {
        productImagesData = [];
      }
    } else if (formData.category === "Books") {
      // Generate title from book title field
      const bookTitle = attributes.bookTitle || "";
      productTitle = bookTitle || "Untitled Book";
      
      // Generate description from book attributes
      const author = attributes.author || "";
      const isbn = attributes.isbn || "";
      const publisher = attributes.publisher || "";
      const format = attributes.format || "";
      const pages = attributes.pages || "";
      const parts = [];
      if (author) parts.push(`Author: ${author}`);
      if (isbn) parts.push(`ISBN: ${isbn}`);
      if (publisher) parts.push(`Publisher: ${publisher}`);
      if (format) parts.push(`Format: ${format}`);
      if (pages) parts.push(`Pages: ${pages}`);
      productDescription = parts.length > 0 ? parts.join(" | ") : null;
      
      // Use book cover as the product image if available
      if (attributes.coverImage) {
        productImagesData = [attributes.coverImage];
      } else {
        productImagesData = [];
      }
    } else if (formData.category === "Courses") {
      // Generate title from course title field
      const courseTitle = attributes.courseTitle || "";
      productTitle = courseTitle || "Untitled Course";
      
      // Generate description from course attributes
      const instructor = attributes.instructor || "";
      const skillLevel = attributes.skillLevel || "";
      const courseDuration = attributes.courseDuration || "";
      const lessonsCount = attributes.lessonsCount || "";
      const parts = [];
      if (instructor) parts.push(`Instructor: ${instructor}`);
      if (skillLevel) parts.push(`Level: ${skillLevel}`);
      if (courseDuration) parts.push(`Duration: ${courseDuration} hours`);
      if (lessonsCount) parts.push(`Lessons: ${lessonsCount}`);
      productDescription = parts.length > 0 ? parts.join(" | ") : null;
      
      // Courses don't have a thumbnail field, so keep generic images or use preview video thumbnail
      // For now, keep productImagesData as is
    }

    const productData = {
      title: productTitle,
      description: productDescription,
      price: parseFloat(formData.price),
      currency: formData.currency,
      category: formData.category,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      seller_id: user.id,
      attributes: attributes,
      images: productImagesData,
      is_active: true, // Explicitly set to active so products are immediately visible
    };

    let error;

    if (editingProduct) {
      const { error: updateError } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("products")
        .insert(productData);
      error = insertError;
    }

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: editingProduct ? "Product updated" : "Product created",
        description: `${productTitle} has been ${editingProduct ? "updated" : "added"} successfully.`,
      });
      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({
        title: "",
        description: "",
        price: "",
        currency: "USD" as Currency,
        category: "",
        stock_quantity: "",
      });
      setAttributes({});
      setProductImages([]);
      fetchProducts();
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description || "",
      price: product.price.toString(),
      currency: (product.currency || "USD") as Currency,
      category: product.category,
      stock_quantity: product.stock_quantity.toString(),
    });
    setAttributes(product.attributes || {});
    setProductImages(product.images || []);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Product deleted",
        description: "The product has been removed.",
      });
      fetchProducts();
    }
  };

  const toggleActive = async (product: Product) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product listings and inventory.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="hero"
              onClick={() => {
                setEditingProduct(null);
                setFormData({
                  title: "",
                  description: "",
                  price: "",
                  currency: "USD" as Currency,
                  category: "",
                  stock_quantity: "",
                });
                setAttributes({});
                setProductImages([]);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      setFormData({ ...formData, category: value });
                      setAttributes({});
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category first" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Generic fields - hidden for categories with specific field definitions */}
                {!["Music", "Books", "Courses"].includes(formData.category) && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title">Product Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Enter product title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Describe your product..."
                        rows={3}
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, currency: value as Currency })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency} - {CURRENCY_INFO[currency].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, stock_quantity: e.target.value })
                      }
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                {/* Image Gallery - hidden for digital/downloadable categories */}
                {user && !["Music", "Books", "Courses"].includes(formData.category) && (
                  <ImageGalleryUpload
                    images={productImages}
                    onChange={setProductImages}
                    userId={user.id}
                    maxImages={6}
                  />
                )}

                {/* Category-specific fields */}
                {formData.category && user && (
                  <CategoryFields
                    category={formData.category}
                    attributes={attributes}
                    onChange={setAttributes}
                    userId={user.id}
                  />
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="hero" className="flex-1">
                    {editingProduct ? "Save Changes" : "Add Product"}
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border border-border rounded-lg overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-12 animate-pulse bg-muted rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No products found. Add your first product to get started!
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={product.stock_quantity > 10 ? "default" : "destructive"}
                    >
                      {product.stock_quantity} in stock
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleActive(product)}>
                          {product.is_active ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
