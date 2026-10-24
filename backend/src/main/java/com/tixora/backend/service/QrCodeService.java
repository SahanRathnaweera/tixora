package com.tixora.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Map;

@Service
public class QrCodeService {

    private static final int SIZE = 300;


    public String generateDataUri(String content) {
        try {
            Map<EncodeHintType, Object> hints = Map.of(
                    EncodeHintType.MARGIN, 1,
                    EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M,
                    EncodeHintType.CHARACTER_SET, "UTF-8");

            BitMatrix matrix = new QRCodeWriter()
                    .encode(content, BarcodeFormat.QR_CODE, SIZE, SIZE, hints);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(out.toByteArray());
        } catch (WriterException | IOException e) {
            throw new IllegalStateException("Could not generate QR code", e);
        }
    }
}

