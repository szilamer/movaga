'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { UploadButton } from '@uploadthing/react';
import { type Product } from '@/types';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  initialData?: Product;
  categories: Category[];
  onSubmit: (data: Product) => Promise<void>;
}

const formSchema = z.object({
  name: z.string().min(1, "Név megadása kötelező"),
  description: z.string().min(1, "Leírás megadása kötelező"),
  price: z.coerce.number().min(0, "Az ár nem lehet negatív"),
  discountedPrice: z.coerce.number().min(0).nullable().optional(),
  categoryId: z.string().min(1, "Kategória kiválasztása kötelező"),
  stock: z.coerce.number().min(0, "A készlet nem lehet negatív"),
});

type FormData = z.infer<typeof formSchema>;

export const ProductForm = ({
  initialData,
  categories,
  onSubmit,
}: ProductFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(initialData?.images || []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      discountedPrice: initialData?.discountedPrice || null,
      categoryId: initialData?.categoryId || "",
      stock: initialData?.stock || 0,
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await onSubmit({
        ...data,
        id: initialData?.id,
        images,
      });
      toast.success("Termék sikeresen mentve!");
    } catch (error) {
      toast.error("Hiba történt a mentés során!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Név</FormLabel>
              <FormControl>
                <Input disabled={loading} placeholder="Termék neve" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Leírás</FormLabel>
              <FormControl>
                <Textarea
                  disabled={loading}
                  placeholder="Termék leírása"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-3 gap-8">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ár</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={loading}
                    placeholder="9999"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="discountedPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Akciós ár (opcionális)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={loading}
                    placeholder="7999"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? null : Number(value));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategória</FormLabel>
                <Select
                  disabled={loading}
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        defaultValue={field.value}
                        placeholder="Válassz kategóriát"
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Készlet</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={loading}
                    placeholder="0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-4">
          <FormLabel>Képek</FormLabel>
          <div className="flex flex-wrap gap-4">
            {images.map((url) => (
              <div key={url} className="relative w-[200px] h-[200px]">
                <img
                  src={url}
                  alt="Product"
                  className="object-cover w-full h-full rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setImages(images.filter((i) => i !== url))}
                >
                  X
                </Button>
              </div>
            ))}
          </div>
          <UploadButton<OurFileRouter>
            endpoint="productImage"
            onClientUploadComplete={(res) => {
              if (res) {
                const urls = res.map((file) => file.url);
                setImages((prev) => [...prev, ...urls]);
                toast.success("Képek sikeresen feltöltve!");
              }
            }}
            onUploadError={(error: Error) => {
              toast.error(`Hiba történt a feltöltés során: ${error.message}`);
            }}
          />
        </div>
        <Button disabled={loading} type="submit">
          {initialData ? "Mentés" : "Létrehozás"}
        </Button>
      </form>
    </Form>
  );
}; 
