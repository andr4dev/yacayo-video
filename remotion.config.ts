import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
// Rango de video estándar y etiquetas BT.709: así se ve igual en Instagram, WhatsApp y YouTube
// (sin esto sale en rango completo, yuvj420p, y algunos reproductores lavan los colores).
Config.setColorSpace("bt709");
