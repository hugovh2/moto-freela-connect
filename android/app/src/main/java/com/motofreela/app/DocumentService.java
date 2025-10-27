package com.motofreela.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.util.Log;
import org.json.JSONObject;
import org.json.JSONException;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

public class DocumentService {
    private static final String TAG = "DocumentService";
    private Context context;
    private NotificationService notificationService;
    private SupabaseService supabaseService;
    
    // Tipos de documentos
    public static final String DOCUMENT_CNH = "cnh";
    public static final String DOCUMENT_CRLV = "crlv";
    public static final String DOCUMENT_SELFIE = "selfie";
    public static final String DOCUMENT_VEHICLE_PHOTO = "vehicle_photo";
    
    public DocumentService(Context context) {
        this.context = context;
        this.notificationService = new NotificationService(context);
        this.supabaseService = new SupabaseService(context);
    }
    
    // Interface para callbacks de upload
    public interface DocumentCallback {
        void onDocumentUploaded(String documentType, String documentUrl);
        void onUploadProgress(int progress);
        void onUploadError(String error);
    }
    
    private DocumentCallback callback;
    
    public void setDocumentCallback(DocumentCallback callback) {
        this.callback = callback;
    }
    
    // Obter labels dos documentos
    public String getDocumentLabel(String documentType) {
        switch (documentType) {
            case DOCUMENT_CNH:
                return "CNH (Carteira Nacional de Habilitação)";
            case DOCUMENT_CRLV:
                return "CRLV (Documento do Veículo)";
            case DOCUMENT_SELFIE:
                return "Selfie com Documento";
            case DOCUMENT_VEHICLE_PHOTO:
                return "Foto do Veículo";
            default:
                return "Documento";
        }
    }
    
    // Obter ícone do documento
    public String getDocumentIcon(String documentType) {
        switch (documentType) {
            case DOCUMENT_CNH:
            case DOCUMENT_CRLV:
                return "📄";
            case DOCUMENT_SELFIE:
            case DOCUMENT_VEHICLE_PHOTO:
                return "📷";
            default:
                return "📋";
        }
    }
    
    // Upload de documento
    public void uploadDocument(String userId, String documentType, String base64Data, String format) {
        try {
            // Converter base64 para bitmap
            byte[] imageBytes = Base64.decode(base64Data, Base64.DEFAULT);
            Bitmap bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length);
            
            if (bitmap == null) {
                if (callback != null) {
                    callback.onUploadError("Erro ao processar imagem");
                }
                return;
            }
            
            // Comprimir imagem
            Bitmap compressedBitmap = compressImage(bitmap, 90);
            
            // Converter para base64 comprimido
            String compressedBase64 = bitmapToBase64(compressedBitmap, format);
            
            // Upload para Supabase Storage
            supabaseService.uploadDocument(userId, documentType, compressedBase64, format, new SupabaseService.SupabaseCallback() {
                @Override
                public void onSuccess(String response) {
                    Log.d(TAG, "Documento enviado com sucesso: " + response);
                    if (callback != null) {
                        callback.onDocumentUploaded(documentType, response);
                    }
                    
                    // Mostrar notificação de sucesso
                    notificationService.showRideNotification(
                        "📄 Documento Enviado",
                        getDocumentLabel(documentType) + " enviado com sucesso!",
                        "document_" + documentType
                    );
                }
                
                @Override
                public void onError(String error) {
                    Log.e(TAG, "Erro no upload: " + error);
                    if (callback != null) {
                        callback.onUploadError("Erro ao enviar documento");
                    }
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Erro no upload do documento: " + e.getMessage());
            if (callback != null) {
                callback.onUploadError("Erro ao processar documento");
            }
        }
    }
    
    // Comprimir imagem
    private Bitmap compressImage(Bitmap bitmap, int quality) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream);
        byte[] compressedBytes = outputStream.toByteArray();
        return BitmapFactory.decodeByteArray(compressedBytes, 0, compressedBytes.length);
    }
    
    // Converter bitmap para base64
    private String bitmapToBase64(Bitmap bitmap, String format) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Bitmap.CompressFormat compressFormat = format.equals("png") ? 
            Bitmap.CompressFormat.PNG : Bitmap.CompressFormat.JPEG;
        bitmap.compress(compressFormat, 90, outputStream);
        byte[] imageBytes = outputStream.toByteArray();
        return Base64.encodeToString(imageBytes, Base64.DEFAULT);
    }
    
    // Simular upload (substituir por integração real com Supabase)
    private void simulateUpload(String filename, String base64Data, String documentType) {
        // Simular progresso
        for (int i = 0; i <= 100; i += 10) {
            if (callback != null) {
                callback.onUploadProgress(i);
            }
            
            try {
                Thread.sleep(100); // Simular delay de upload
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }
        
        // Simular URL do documento
        String documentUrl = String.format("https://storage.supabase.com/documents/%s", filename);
        
        Log.d(TAG, "Documento enviado: " + filename);
        
        if (callback != null) {
            callback.onDocumentUploaded(documentType, documentUrl);
        }
        
        // Mostrar notificação de sucesso
        notificationService.showRideNotification(
            "📄 Documento Enviado",
            getDocumentLabel(documentType) + " enviado com sucesso!",
            "document_" + documentType
        );
    }
    
    // Validar tipo de documento
    public boolean isValidDocumentType(String documentType) {
        return DOCUMENT_CNH.equals(documentType) ||
               DOCUMENT_CRLV.equals(documentType) ||
               DOCUMENT_SELFIE.equals(documentType) ||
               DOCUMENT_VEHICLE_PHOTO.equals(documentType);
    }
    
    // Obter tamanho máximo do arquivo (em MB)
    public int getMaxFileSizeMB() {
        return 5; // 5MB
    }
    
    // Validar tamanho do arquivo
    public boolean isValidFileSize(String base64Data) {
        // Calcular tamanho aproximado do base64
        int sizeInBytes = (base64Data.length() * 3) / 4;
        int sizeInMB = sizeInBytes / (1024 * 1024);
        return sizeInMB <= getMaxFileSizeMB();
    }
    
    // Obter formatos suportados
    public String[] getSupportedFormats() {
        return new String[]{"jpg", "jpeg", "png"};
    }
    
    // Validar formato do arquivo
    public boolean isValidFormat(String format) {
        String[] supportedFormats = getSupportedFormats();
        for (String supportedFormat : supportedFormats) {
            if (supportedFormat.equalsIgnoreCase(format)) {
                return true;
            }
        }
        return false;
    }
    
    // Salvar documento localmente (para cache)
    public String saveDocumentLocally(String userId, String documentType, Bitmap bitmap, String format) {
        try {
            File documentsDir = new File(context.getFilesDir(), "documents");
            if (!documentsDir.exists()) {
                documentsDir.mkdirs();
            }
            
            String filename = String.format("%s_%s.%s", userId, documentType, format);
            File file = new File(documentsDir, filename);
            
            FileOutputStream outputStream = new FileOutputStream(file);
            Bitmap.CompressFormat compressFormat = format.equals("png") ? 
                Bitmap.CompressFormat.PNG : Bitmap.CompressFormat.JPEG;
            bitmap.compress(compressFormat, 90, outputStream);
            outputStream.close();
            
            return file.getAbsolutePath();
        } catch (IOException e) {
            Log.e(TAG, "Erro ao salvar documento localmente: " + e.getMessage());
            return null;
        }
    }
    
    // Obter documento salvo localmente
    public Bitmap getLocalDocument(String userId, String documentType, String format) {
        try {
            File documentsDir = new File(context.getFilesDir(), "documents");
            String filename = String.format("%s_%s.%s", userId, documentType, format);
            File file = new File(documentsDir, filename);
            
            if (file.exists()) {
                return BitmapFactory.decodeFile(file.getAbsolutePath());
            }
        } catch (Exception e) {
            Log.e(TAG, "Erro ao carregar documento local: " + e.getMessage());
        }
        return null;
    }
}
