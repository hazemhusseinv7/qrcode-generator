"use client";

import { useSearchParams } from "next/navigation";
import { useState, useRef, Suspense, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { FaFilePdf, FaImage, FaDownload, FaHome } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
// import { CopyButton } from "@/components/ui/shadcn-io/copy-button";

/**
 * Interface defining the structure of QR code data
 * persisted in localStorage and used throughout the application
 */
interface QRData {
  details: string;
  license: string;
  officeName: string;
  officeLogo: string;
}

/**
 * Main QR code display and download component
 * Handles QR code rendering, canvas generation, and file exports
 */
function QRContent() {
  // Component state management
  const searchParams = useSearchParams();
  const [isDownloading, setIsDownloading] = useState("");
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  // Retrieve data key from URL parameters
  const dataKey = searchParams.get("dataKey") || "";

  /**
   * Effect hook to load QR data from localStorage on component mount
   * Uses dataKey from URL parameters to retrieve persisted data
   */
  useEffect(() => {
    if (dataKey) {
      try {
        const storedData = localStorage.getItem(dataKey);
        if (storedData) {
          const parsedData: QRData = JSON.parse(storedData);
          setQrData(parsedData);
        }
      } catch (error) {
        console.error("Error loading QR data:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [dataKey]);

  /**
   * PNG image download handler
   * Generates high-quality canvas and triggers browser download
   */
  const downloadAsImage = async () => {
    if (!qrData) {
      alert("لا توجد بيانات متاحة للتحميل");
      return;
    }

    setIsDownloading("image");

    try {
      const canvas = await createQRCanvas();
      const link = document.createElement("a");
      link.download = `رمز-QR-العقاري-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading image:", error);
      alert("حدث خطأ أثناء حفظ الصورة");
    } finally {
      setIsDownloading("");
    }
  };

  /**
   * PDF document download handler
   * Converts canvas to PDF format with proper scaling and layout
   */
  const downloadAsPDF = async () => {
    if (!qrData) {
      alert("لا توجد بيانات متاحة للتحميل");
      return;
    }

    setIsDownloading("pdf");

    try {
      const canvas = await createQRCanvas();
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.95;

      const width = imgWidth * ratio;
      const height = imgHeight * ratio;
      const x = (pdfWidth - width) / 2;
      const y = (pdfHeight - height) / 2;

      pdf.addImage(imgData, "PNG", x, y, width, height);
      pdf.save(`رمز-QR-العقاري-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("حدث خطأ أثناء حفظ PDF");
    } finally {
      setIsDownloading("");
    }
  };

  /**
   * Generates QR code as HTMLImageElement with custom logo overlay
   * Uses qrcode library for high-quality QR generation
   * @param value - URL or text to encode in QR code
   * @param size - Dimensions of the output QR code image
   * @returns Promise resolving to HTMLImageElement
   */
  const createQRCodeImage = async (
    value: string,
    size: number,
    showLogo: boolean = true // Add this parameter with default value
  ): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      try {
        // Generate QR code as data URL using qrcode library
        QRCode.toDataURL(
          value,
          {
            width: size,
            margin: 1,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          },
          (err: Error | null | undefined, url: string) => {
            if (err) {
              reject(err);
              return;
            }

            const qrImg = new Image();
            qrImg.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext("2d")!;

              // Draw QR code as base layer
              ctx.drawImage(qrImg, 0, 0, size, size);

              // Only add logo if showLogo is true
              if (showLogo) {
                // Calculate logo container dimensions
                const logoContainerSize = size / 5;
                const centerX = size / 2;
                const centerY = size / 2;

                // Create the white background with rounded corners
                const borderRadius = logoContainerSize * 0.2;
                ctx.fillStyle = "#FFFFFF";

                // Draw rounded rectangle for background
                ctx.beginPath();
                ctx.roundRect(
                  centerX - logoContainerSize / 2,
                  centerY - logoContainerSize / 2,
                  logoContainerSize,
                  logoContainerSize,
                  borderRadius
                );
                ctx.fill();

                // Add padding
                const padding = logoContainerSize * 0.08;
                const logoAreaSize = logoContainerSize - padding * 2;

                // Now load and draw the actual logo icon
                const logoImg = new Image();
                logoImg.crossOrigin = "anonymous";
                logoImg.onload = () => {
                  // Calculate logo position with padding
                  const logoX = centerX - logoAreaSize / 2;
                  const logoY = centerY - logoAreaSize / 2;

                  // Draw the logo with proper padding
                  ctx.drawImage(
                    logoImg,
                    logoX,
                    logoY,
                    logoAreaSize,
                    logoAreaSize
                  );

                  // Convert back to image
                  const finalImg = new Image();
                  finalImg.onload = () => {
                    resolve(finalImg);
                  };
                  finalImg.onerror = () => {
                    reject(new Error("Failed to create QR code image"));
                  };
                  finalImg.src = canvas.toDataURL();
                };

                logoImg.onerror = () => {
                  // If logo fails to load, just use the QR code without logo
                  const finalImg = new Image();
                  finalImg.onload = () => {
                    resolve(finalImg);
                  };
                  finalImg.onerror = () => {
                    reject(new Error("Failed to create QR code image"));
                  };
                  finalImg.src = canvas.toDataURL();
                };

                // Try to load the logo from the same path as used in the display
                logoImg.src = "/logo/logo.png";
              } else {
                // If no logo needed, just return the QR code as is
                const finalImg = new Image();
                finalImg.onload = () => {
                  resolve(finalImg);
                };
                finalImg.onerror = () => {
                  reject(new Error("Failed to create QR code image"));
                };
                finalImg.src = canvas.toDataURL();
              }
            };

            qrImg.onerror = () => {
              reject(new Error("Failed to load QR code"));
            };
            qrImg.src = url;
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  };

  /**
   * Loads a font for canvas rendering with fallback support
   * @param ctx - Canvas rendering context
   * @param fontSize - Desired font size
   * @param fontWeight - Font weight (normal, bold, etc.)
   */
  const setCanvasFont = (
    ctx: CanvasRenderingContext2D,
    fontSize: number,
    fontWeight: string = "normal"
  ) => {
    // Font stack with Arabic-supporting fonts and fallbacks
    const fontStack = [
      "Tajawal",
      "Segoe UI",
      "Tahoma",
      "Arial",
      "sans-serif",
    ].join(", ");

    ctx.font = `${fontWeight} ${fontSize}px ${fontStack}`;
  };

  /**
   * Main canvas generation function for high-quality output
   * Composes all elements (office info, QR codes, text) into a single canvas
   * @returns Promise resolving to HTMLCanvasElement
   */
  const createQRCanvas = async (): Promise<HTMLCanvasElement> => {
    if (!qrData) throw new Error("No QR data available");

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Could not get canvas context");

      // Set canvas size for high quality output (print-ready dimensions)
      const width = 1200;
      const height = 1600;
      canvas.width = width;
      canvas.height = height;

      // White background for clean print output
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Add office info if available
      let currentY = 100;

      if (qrData?.officeName || qrData?.officeLogo) {
        // Add office logo if available
        if (qrData.officeLogo) {
          const logoImg = new Image();
          logoImg.crossOrigin = "anonymous";

          await new Promise((resolve, reject) => {
            logoImg.onload = () => resolve(true);

            logoImg.onerror = () =>
              reject(new Error("Failed to load office logo"));

            logoImg.src = qrData.officeLogo;
          });

          const logoSize = 120;
          ctx.drawImage(
            logoImg,
            width / 2 - logoSize / 2,
            currentY,
            logoSize,
            logoSize
          );
          currentY += logoSize + 30;
        }

        // Add office name if available
        if (qrData.officeName) {
          setCanvasFont(ctx, 32, "bold");
          ctx.fillText("المكتب الوسيط", width / 2, currentY);
          currentY += 40;
          setCanvasFont(ctx, 28, "normal");
          ctx.fillText(qrData.officeName, width / 2, currentY);
          currentY += 80;
        }
      }

      // Create main QR code for property details
      const mainQRSize = Math.floor(width * 0.75);
      const mainQRImg = await createQRCodeImage(
        qrData.details,
        mainQRSize,
        true
      );

      ctx.drawImage(
        mainQRImg,
        width / 2 - mainQRSize / 2,
        currentY,
        mainQRSize,
        mainQRSize
      );
      currentY += mainQRSize + 50;

      // Add main QR title
      setCanvasFont(ctx, 32, "bold");
      ctx.fillText("تفاصيل العقار ومالك العقار", width / 2, currentY);
      currentY += 80;

      currentY += 30;

      // Create license section background
      const licenseSectionHeight = 200;
      const licenseSectionY = currentY;
      ctx.fillStyle = "#f8f9fa";
      ctx.fillRect(50, licenseSectionY, width - 100, licenseSectionHeight);
      ctx.fillStyle = "#000000";

      const licenseCenterY = licenseSectionY + licenseSectionHeight / 2;

      // Create license QR code
      const licenseQRImg = await createQRCodeImage(qrData.license, 150, false);

      ctx.drawImage(licenseQRImg, 150, licenseCenterY - 75, 150, 150);

      // Add license text
      setCanvasFont(ctx, 28, "bold");
      ctx.textAlign = "right";
      ctx.fillText("رخصة الإعلان من هيئة العقار", width - 150, licenseCenterY);

      return canvas;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Custom QR code component with centered logo overlay
   * Used for display purposes in the UI
   */
  const CustomQRCode = ({
    value,
    size,
    showLogo = true,
  }: {
    value: string;
    size: number;
    showLogo?: boolean;
  }) => (
    <div className="relative inline-block rounded-md overflow-hidden">
      <QRCodeSVG
        value={value}
        size={size}
        level="H"
        includeMargin
        bgColor="#FFFFFF"
        fgColor="#000000"
      />
      {showLogo && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-white p-1 rounded-lg border">
            <img
              src="/logo/logo.png"
              alt="Logo"
              width={24}
              height={24}
              className="size-6 object-contain"
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  // Loading state display
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <AiOutlineLoading3Quarters className="animate-spin size-7 text-emerald-700" />
      </div>
    );
  }

  // Error state for incomplete data
  if (!qrData?.details || !qrData?.license) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle className="text-destructive">
              بيانات غير مكتملة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                يرجى التأكد من إدخال كل من رابط تفاصيل العقار والرخصة العقارية
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => window.history.back()}
              className="w-full gap-2"
            >
              <FaHome className="text-sm" />
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Destructure QR data for rendering
  const {
    details: propertyDetails,
    license: propertyLicense,
    officeName,
    officeLogo,
  } = qrData;

  return (
    <div className="min-h-screen bg-zinc-950 py-4 px-3 sm:py-8 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Header Section */}
        <div className="text-center space-y-3 sm:space-y-4 px-2">
          <Badge variant="secondary" className="text-sm py-1 px-3">
            منشئ رموز QR
          </Badge>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-700">
            رموز QR العقارية
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            احفظ هذه الرموز للوصول السريع إلى معلومات العقار. كما يمكنك طباعة
            الرموز أيضاً
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-start">
          {/* QR Codes Display Card */}
          <Card className="h-full border-0 shadow-2xl shadow-zinc-900 bg-linear-to-tr from-zinc-800 to-zinc-900 backdrop-blur-sm w-full">
            <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl">
                معاينة الرموز
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                هذه المعاينة مطابقة تماماً للملف المحمل
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div
                ref={qrContainerRef}
                className="bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-6 space-y-6 sm:space-y-8 border w-full"
              >
                {/* Office Information Section */}
                {(officeName || officeLogo) && (
                  <div className="text-center space-y-3 sm:space-y-4 border-b pb-4 sm:pb-6">
                    <div className="flex items-center justify-center gap-3 sm:gap-4">
                      {officeLogo && (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 border rounded-lg overflow-hidden bg-white">
                          <img
                            src={officeLogo}
                            alt="شعار المكتب الوسيط"
                            className="w-full h-full object-contain p-1"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      {officeName && (
                        <div>
                          <p className="text-sm sm:text-base text-muted-foreground">
                            المكتب الوسيط
                          </p>
                          <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                            {officeName}
                          </h3>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Main Property QR Code Section */}
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="flex justify-center">
                    <div className="border-2 sm:border-4 border-primary/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-white dark:bg-emerald-700/20">
                      <CustomQRCode
                        value={propertyDetails}
                        size={
                          typeof window !== "undefined" &&
                          window.innerWidth < 640
                            ? 120
                            : 180
                        }
                        showLogo={true}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                      تفاصيل العقار ومالك العقار
                    </h3>
                    {/* <div className="bg-muted/50 rounded-lg p-2 sm:p-3 flex items-center gap-2">
                      <p
                        className="text-xs sm:text-sm text-muted-foreground break-all text-center word-break-break-all flex-1"
                        dir="ltr"
                      >
                        {propertyDetails}
                      </p>
                      <CopyButton
                        content={propertyDetails}
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                      />
                    </div> */}
                  </div>
                </div>

                {/* License QR Code Section */}
                <div className="bg-muted/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-3 sm:gap-6">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="flex border-2 border-primary/20 rounded-lg sm:rounded-xl p-2 sm:p-3 bg-white dark:bg-emerald-700/20 shrink-0">
                        <CustomQRCode
                          value={propertyLicense}
                          size={
                            typeof window !== "undefined" &&
                            window.innerWidth < 640
                              ? 50
                              : 70
                          }
                          showLogo={false}
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-sm sm:text-lg">
                          رخصة الإعلان <br className="max-lg:hidden" />
                          من هيئة العقار
                        </h4>

                        {/* <div className="bg-background rounded-lg p-1 sm:p-2 flex items-center gap-2">
                          <p
                            className="text-xs text-muted-foreground break-all word-break-break-all flex-1"
                            dir="ltr"
                          >
                            {propertyLicense}
                          </p>
                          <CopyButton
                            content={propertyLicense}
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                          />
                        </div> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download Options Card */}
          <Card className="h-full border-0 shadow-2xl shadow-zinc-900 bg-linear-to-tr from-zinc-800 to-zinc-900 backdrop-blur-sm w-full lg:sticky lg:top-8">
            <CardHeader className="text-center px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl">
                تحميل الرموز
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                اختر الصيغة المناسبة لاحتياجاتك
              </CardDescription>
            </CardHeader>
            <CardContent className="h-full flex flex-col justify-between space-y-4 sm:space-y-6 px-3 sm:px-6">
              {/* Download Action Buttons */}
              <div className="space-y-3 sm:space-y-4">
                <Button
                  onClick={downloadAsImage}
                  disabled={!!isDownloading}
                  variant="outline"
                  className="transition-colors duration-300 cursor-pointer w-full h-12 sm:h-16 text-base sm:text-lg gap-2 sm:gap-3 border-2 hover:bg-blue-50 dark:hover:bg-emerald-950/40 hover:border-blue-300"
                  size="lg"
                >
                  {isDownloading === "image" ? (
                    <AiOutlineLoading3Quarters className="animate-spin size-4.5 text-emerald-700" />
                  ) : (
                    <FaImage className="text-emerald-700 text-lg sm:text-xl" />
                  )}
                  <span className="text-sm sm:text-base">حفظ كصورة (PNG)</span>
                </Button>

                <Button
                  onClick={downloadAsPDF}
                  disabled={!!isDownloading}
                  className="cursor-pointer w-full h-12 sm:h-16 text-base sm:text-lg gap-2 sm:gap-3 bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-500 transition-colors duration-300"
                  size="lg"
                >
                  {isDownloading === "pdf" ? (
                    <AiOutlineLoading3Quarters className="animate-spin size-4.5 text-white" />
                  ) : (
                    <FaFilePdf className="text-lg sm:text-xl" />
                  )}
                  <span className="text-sm sm:text-base">حفظ كPDF</span>
                </Button>
              </div>

              <div className="flex flex-col gap-2 lg:gap-8 justify-between">
                {/* Features List */}
                <div className="space-y-2 sm:space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
                    <FaDownload className="text-primary text-sm sm:text-base" />
                    ميزات الملفات المحملة:
                  </h4>
                  <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mt-1 sm:mt-1.5 shrink-0"></div>
                      <span>جودة عالية تناسب الطباعة بحجم 1.5×1.5 متر</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mt-1 sm:mt-1.5 shrink-0"></div>
                      <span>دقة 300 نقطة في البوصة (DPI)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mt-1 sm:mt-1.5 shrink-0"></div>
                      <span>شعار الشركة مضمن في وسط رموز QR</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mt-1 sm:mt-1.5 shrink-0"></div>
                      <span>تصميم متوافق مع الطابعات التجارية</span>
                    </li>
                  </ul>
                </div>

                {/* Usage Instructions */}
                <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-700">
                  <AlertDescription className="text-xs sm:text-sm">
                    <strong>ملاحظة:</strong> للحصول على أفضل جودة طباعة، استخدم
                    ملف PDF للطباعة التجارية أو الصورة للاستخدام الرقمي.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Footer */}
        <Card className="shadow-2xl shadow-zinc-900 border-0 bg-linear-to-br from-zinc-800 to-zinc-900 w-full">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="text-center sm:text-right">
                <h4 className="font-semibold text-foreground text-sm sm:text-base">
                  إنشاء رموز جديدة؟
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  يمكنك العودة للصفحة الرئيسية لإنشاء رموز جديدة
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                className="gap-2 w-full sm:w-auto cursor-pointer"
                size="sm"
              >
                <FaHome className="text-sm" />
                <span className="text-sm">العودة للرئيسية</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Main page component with Suspense boundary for Next.js navigation
 * Provides loading fallback during data fetching
 */
export default function QRPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <AiOutlineLoading3Quarters className="animate-spin size-7 text-emerald-700" />
        </div>
      }
    >
      <QRContent />
    </Suspense>
  );
}
