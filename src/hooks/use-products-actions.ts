import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase"; // تأكد من مسار إعداد supabase لديك
import { toast } from "sonner";

export interface Product {
  id: string;
  title: string;
  price: number;
  description?: string;
  image_url: string;
  media_id?: string;
  is_from_media: boolean;
  created_at?: string;
}

export function useProductActions() {
  const queryClient = useQueryClient();

  // 1. التعديل (Update)
  const updateMutation = useMutation({
    mutationFn: async (updatedProduct: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updatedProduct)
        .eq("id", updatedProduct.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم تحديث المنتج وحفظ التعديلات بدقة!");
    },
    onError: (error) => {
      toast.error(`فشل التعديل: ${error.message}`);
    },
  });

  // 2. الحذف (Delete)
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم حذف المنتج بنجاح.");
    },
    onError: (error) => {
      toast.error(`فشل الحذف: ${error.message}`);
    },
  });

  // 3. التكرار (Duplicate) - يضمن نسخ روابط الميديا بدقة
  const duplicateMutation = useMutation({
    mutationFn: async (product: Product) => {
      // تجهيز بيانات النسخة الجديدة مع الحفاظ على روابط الميديا
      const duplicatedData = {
        title: `${product.title} (نسخة)`,
        price: product.price,
        description: product.description,
        image_url: product.image_url,
        media_id: product.media_id, // الحفاظ على رابط الميديا الأصلي
        is_from_media: product.is_from_media,
      };

      const { data, error } = await supabase
        .from("products")
        .insert([duplicatedData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم تكرار المنتج بنجاح مع كامل بيانات الميديا الخاصه به.");
    },
    onError: (error) => {
      toast.error(`فشل تكرار المنتج: ${error.message}`);
    },
  });

  return {
    updateProduct: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteProduct: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    duplicateProduct: duplicateMutation.mutate,
    isDuplicating: duplicateMutation.isPending,
  };
}
