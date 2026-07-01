import React, { useState } from "react";
import { MoreHorizontal, Edit, Trash2, Copy, Image } from "lucide-react";
import { useProductActions, Product } from "@/hooks/use-products-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// تحديد شروط التحقق من البيانات بدقة (تم تصحيح السطر هنا)
const productSchema = z.object({
  title: z.string().min(3, "العنوان يجب ان يكون اكثر من 3 احرف"),
  price: z.coerce.number().min(1, "السعر يجب ان يكون اكبر من 0"),
  description: z.string().optional(),
});

interface ProductCardActionsProps {
  product: Product;
}

export function ProductCardActions({ product }: ProductCardActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { deleteProduct, duplicateProduct, updateProduct, isUpdating } = useProductActions();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product.title,
      price: product.price,
      description: product.description || "",
    },
  });

  const onUpdateSubmit = (values: z.infer<typeof productSchema>) => {
    updateProduct(
      { id: product.id, ...values },
      {
        onSuccess: () => setIsEditDialogOpen(false),
      }
    );
  };

  return (
    <>
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>إجراءات المنتج</DropdownMenuLabel>
          
          {/* مؤشر مميز للمنتجات التي أصلها من الميديا */}
          {product.is_from_media && (
            <div className="flex items-center gap-1 px-2 py-1 text-xs text-amber-600 bg-amber-50 rounded-sm mb-1">
              <Image className="h-3 w-3" />
              <span>مرتبط بالمكتبة رقمياً</span>
            </div>
          )}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="ml-2 h-4 w-4" /> تعديل البيانات
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => duplicateProduct(product)}>
            <Copy className="ml-2 h-4 w-4" /> تكرار (نسخ دقيق)
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="text-red-600 focus:bg-red-50" 
            onClick={() => {
              if(confirm("هل أنت متأكد من حذف هذا المنتج نهائياً؟")) {
                deleteProduct(product.id);
              }
            }}
          >
            <Trash2 className="ml-2 h-4 w-4" /> حذف المنتج
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* نافذة التعديل الدقيق */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تعديل منتج: {product.title}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onUpdateSubmit)} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">اسم المنتج</label>
              <input 
                {...form.register("title")} 
                className="w-full p-2 border rounded-md mt-1 bg-background"
              />
              {form.formState.errors.title && (
                <p className="text-xs text-red-500 mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">السعر ($)</label>
              <input 
                type="number" 
                {...form.register("price")} 
                className="w-full p-2 border rounded-md mt-1 bg-background"
              />
              {form.formState.errors.price && (
                <p className="text-xs text-red-500 mt-1">{form.formState.errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">الوصف</label>
              <textarea 
                {...form.register("description")} 
                className="w-full p-2 border rounded-md mt-1 h-20 bg-background"
              />
            </div>

            {/* عرض مرئي للرابط الثابت للميديا لضمان الدقة وتأكيد الحفظ */}
            <div className="p-2 bg-muted border rounded-md flex items-center gap-2">
              <img src={product.image_url} alt="preview" className="w-12 h-12 rounded object-cover" />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-muted-foreground truncate">رابط الصورة الثابت والمحمي:</p>
                <p className="text-[10px] text-muted-foreground/70 truncate font-mono">{product.image_url}</p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isUpdating}>
              {isUpdating ? "جاري حفظ التعديلات..." : "حفظ التعديلات بدقة"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
