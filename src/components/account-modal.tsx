"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase/client"
import Cropper from "react-easy-crop"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner";
import { Loader2Icon, CameraIcon, ZoomInIcon } from "lucide-react";
import { updateProfile } from "@/app/actions/users";

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
}

export function AccountModal({ open, onOpenChange, user }: AccountModalProps) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = React.useState(user.name);
  const [loading, setLoading] = React.useState(false);
  const [avatarPreview, setAvatarPreview] = React.useState(user.avatar);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<any>(null);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const onCropComplete = React.useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createCroppedImage = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("No 2d context");

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      let avatarUrl = user.avatar;

      if (imageToCrop && croppedAreaPixels) {
        // Create cropped image blob
        const croppedBlob = await createCroppedImage(imageToCrop, croppedAreaPixels);
        const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });

        // Upload image to Supabase Storage (Client side upload is fine as Storage RLS is configured)
        const fileName = `${user.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        
        avatarUrl = publicUrl;
      }

      // Use Server Action to update both Auth Metadata and DB record
      const result = await updateProfile({
        name,
        avatar_url: avatarUrl
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Perfil atualizado com sucesso!");
      onOpenChange(false);
      setImageToCrop(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil");
      console.error("Update Profile Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setImageToCrop(null)
      onOpenChange(val)
    }}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Minha Conta</DialogTitle>
          <DialogDescription>
            {imageToCrop ? "Ajuste sua foto de perfil." : "Edite suas informações de perfil e altere seu avatar."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {imageToCrop ? (
            <div className="flex flex-col gap-4">
              <div className="relative h-64 w-full bg-muted rounded-md overflow-hidden">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="flex items-center gap-4 px-2">
                <ZoomInIcon className="size-4 text-muted-foreground" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setImageToCrop(null)}>
                  Voltar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Avatar className="h-28 w-28 border-4 border-background shadow-xl transition-all group-hover:brightness-90">
                    <AvatarImage src={avatarPreview} />
                    <AvatarFallback className="text-2xl bg-primary/5">
                      {name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground p-2 rounded-full shadow-lg border-2 border-background">
                    <CameraIcon className="size-4" />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <p className="text-xs text-muted-foreground font-medium">Clique na foto para alterar</p>
              </div>
              <div className="grid gap-4">
                <Field>
                  <FieldLabel htmlFor="name">Nome completo</FieldLabel>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="h-10"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">E-mail</FieldLabel>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-muted/50 h-10 border-dashed"
                  />
                </Field>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => {
            setImageToCrop(null)
            onOpenChange(false)
          }}>
            {imageToCrop ? "Cancelar" : "Fechar"}
          </Button>
          <Button onClick={handleUpdateProfile} disabled={loading} className="min-w-[120px]">
            {loading ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
            {imageToCrop ? "Aplicar e Salvar" : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
