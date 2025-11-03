"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MdQrCode2 } from "react-icons/md";
import Image from "next/image";

export default function Home() {
  // State management for form inputs and UI
  const [propertyDetails, setPropertyDetails] = useState("");
  const [propertyLicense, setPropertyLicense] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [officeLogo, setOfficeLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [errors, setErrors] = useState({ details: "", license: "" });
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  /**
   * Validates URL format using native URL constructor
   * @param url - The URL string to validate
   * @returns boolean indicating URL validity
   */
  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Handles office logo file upload with validation and preview generation
   * @param e - File input change event
   */
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB to prevent issues)
      if (file.size > 2 * 1024 * 1024) {
        alert("حجم الصورة يجب أن يكون أقل من 2MB");
        return;
      }
      setOfficeLogo(file);
      // Create preview URL for immediate user feedback
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  /**
   * Main QR code generation handler with comprehensive validation
   * Processes form data and navigates to QR display page
   */
  const handleGenerate = async () => {
    // Initialize error state
    const newErrors = { details: "", license: "" };

    // Validate property details URL
    if (!propertyDetails) {
      newErrors.details = "يرجى إدخال رابط تفاصيل العقار";
    } else if (!validateUrl(propertyDetails)) {
      newErrors.details = "يرجى إدخال رابط صحيح";
    }

    // Validate property license URL
    if (!propertyLicense) {
      newErrors.license = "يرجى إدخال رابط الرخصة العقارية";
    } else if (!validateUrl(propertyLicense)) {
      newErrors.license = "يرجى إدخال رابط صحيح";
    }

    setErrors(newErrors);

    // Proceed only if no validation errors
    if (!newErrors.details && !newErrors.license) {
      setIsGenerating(true);

      try {
        // Prepare QR data object for storage
        const qrData = {
          details: propertyDetails,
          license: propertyLicense,
          officeName: officeName || "",
          officeLogo: "",
        };

        // Convert logo to base64 for persistent storage
        if (officeLogo) {
          const logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(officeLogo);
          });
          qrData.officeLogo = logoBase64;
        }

        // Generate unique storage key and persist data
        const storageKey = `qrData_${Date.now()}`;
        localStorage.setItem(storageKey, JSON.stringify(qrData));

        // Navigate to QR display page with storage reference
        const queryParams = new URLSearchParams({
          dataKey: storageKey,
        });

        router.push(`/qr?${queryParams.toString()}`);
      } catch (error) {
        console.error("Error generating QR codes:", error);
        alert("حدث خطأ أثناء إنشاء الرموز");
        setIsGenerating(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl shadow-zinc-900 border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <MdQrCode2 className="text-3xl text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl text-emerald-700">
              منشئ رمز QR العقاري
            </CardTitle>
            <CardDescription className="text-base">
              أدخل روابط العقار لإنشاء رموز QR
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Office Name Input Section */}
            <div className="space-y-2">
              <Label htmlFor="office-name" className="text-right">
                المكتب الوسيط
              </Label>
              <Input
                id="office-name"
                type="text"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder="أدخل اسم المكتب الوسيط"
              />
            </div>

            {/* Office Logo Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="office-logo" className="text-right">
                شعار المكتب الوسيط
              </Label>
              <Input
                id="office-logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="cursor-pointer"
              />
              {logoPreview && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    معاينة الشعار:
                  </p>
                  <div className="size-20 border rounded-lg overflow-hidden">
                    <Image
                      width={80}
                      height={80}
                      src={logoPreview}
                      alt="معاينة الشعار"
                      className="size-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Property Details URL Input */}
            <div className="space-y-2">
              <Label htmlFor="property-details" className="text-right">
                رابط تفاصيل العقار ومالك العقار
              </Label>
              <Input
                id="property-details"
                type="url"
                value={propertyDetails}
                onChange={(e) => {
                  setPropertyDetails(e.target.value);
                  if (errors.details)
                    setErrors((prev) => ({ ...prev, details: "" }));
                }}
                placeholder="https://example.com/property-details"
                className={errors.details ? "border-destructive" : ""}
              />
              {errors.details && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription>{errors.details}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Property License URL Input */}
            <div className="space-y-2">
              <Label htmlFor="property-license" className="text-right">
                رابط رخصة الإعلان من هيئة العقار
              </Label>
              <Input
                id="property-license"
                type="url"
                value={propertyLicense}
                onChange={(e) => {
                  setPropertyLicense(e.target.value);
                  if (errors.license)
                    setErrors((prev) => ({ ...prev, license: "" }));
                }}
                placeholder="https://example.com/property-license"
                className={errors.license ? "border-destructive" : ""}
              />
              {errors.license && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription>{errors.license}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Primary Action Button */}
          <Button
            onClick={handleGenerate}
            disabled={!propertyDetails || !propertyLicense || isGenerating}
            className="w-full gap-2 py-6 text-lg cursor-pointer"
            size="lg"
          >
            {isGenerating ? (
              <div className="animate-spin size-5 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <MdQrCode2 className="text-lg" />
            )}
            {isGenerating ? "جاري الإنشاء..." : "إنشاء رموز QR"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
