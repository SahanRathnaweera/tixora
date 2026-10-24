package com.tixora.backend.service;


import com.tixora.backend.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageService {
    private static final Map<String, String> ALLOWED = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif");

    private final Path root;

    public FileStorageService(@Value("${app.upload-dir}") String uploadDir) throws IOException {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    public Path getRoot() {
        return root;
    }

    /** Saves the image under a random name and returns that file name. */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please choose an image file");
        }
        String extension = ALLOWED.get(file.getContentType());
        if (extension == null) {
            throw new BadRequestException("Only JPG, PNG, WEBP or GIF images are allowed");
        }

        String fileName = UUID.randomUUID() + extension;
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, root.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Could not store the uploaded file", e);
        }
        return fileName;
    }
}
