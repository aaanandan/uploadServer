import { access, mkdir, readdir } from "node:fs";
import express from "express";
import fileUpload from "express-fileupload";
import path from "node:path";
import { appendToGoogleSheet } from "./updateGoogelSheet.mjs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const app = express();

const port = 5500;
const uploadFolder = "uploads";
const spreadsheetId = "1ZPhvFi0vC3TCy2l7XAzgdSuf2Gp6HDXuvah7pqlFQ1I"; // Replace with your sheet ID
const sheetName = "Sheet4"; // Replace with the range you want to update
const zentURL = "https://zenphoto.kailasamailer.com/albums/";
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

// Middleware
app.use(express.static("public"));
app.use(
  fileUpload({
    createParentPath: true,
    preserveExtension: true,
    safeFileNames: true,
    abortOnLimit: true,
    responseOnLimit: "File size limit has been reached",
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    createParentPath: true,
  })
);

// Serve the upload form
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle file uploads
app.post("/upload", async (req, res) => {
  try {
    // if (!req.files || Object.keys(req.files).length === 0) {
    //   return res
    //     .status(400)
    //     .json({ status: false, message: "No files were uploaded." });
    // }

    if (!req.files || !req.body.paths) {
      return res.status(400).send("No files or paths received.");
    }

    const uploadedFiles = [];
    const rows = [
      [
        "FileName",
        "RelativePath",
        "FolderName",
        "SubSectionTitle",
        "ZenImageURL",
      ],
    ]; // Ensure headers match your Google Sheet

    // FileName	RelativePath	FolderName	SubSectionTitle	ZenImageURL
    const files = req.files["files[]"];
    const filePaths = Array.isArray(req.body.paths)
      ? req.body.paths
      : [req.body.paths];

    const filesArray = Array.isArray(files) ? files : [files];
    // Create base uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, "uploads");
    access(uploadsDir, async (err) => {
      if (err) {
        console.log(err);
      } else {
        mkdir(uploadsDir, { recursive: true }, (err) => {
          if (err) {
            console.log(err);
          }
        });
      }
    });
    filesArray.forEach(async (file, index) => {
      // Get the relative path from the file object (includes folder structure)
      const relativePath = filePaths[index]; // Get folder structure

      // Create the full path under the uploads directory
      const fullPath = path.join(uploadsDir, relativePath);

      const dir = path.dirname(fullPath);
      // Create all parent directories

      access(dir, async (err) => {
        if (err) {
          mkdir(dir, { recursive: true }, (err) => {});
        } else {
          await file.mv(fullPath);
        }
      });

      // console.log(`File uploaded to: ${fullPath}`); // Debug log
      uploadedFiles.push(relativePath);
      const filename = path.basename(relativePath);
      const dirName = path.dirname(relativePath);
      const zenImageURL = zentURL + relativePath;
      rows.push([filename, relativePath, dirName, dirName, zenImageURL]);
    });

    appendToGoogleSheet(spreadsheetId, sheetName, rows);
    // console.log(rows);

    res.json({
      status: true,
      message: "Files uploaded successfully",
      files: uploadedFiles,
    });

    // Example Usage
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
});

// Get uploaded files list
app.get("/files", async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, "uploads");
    const files = await listFilesRecursively(uploadDir);
    res.json({ files });
  } catch (err) {
    console.error("List files error:", err);
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
});

// Recursive function to list all files and folders
async function listFilesRecursively(dir) {
  const fileList = [];
  readdir(dir, { withFileTypes: true }, async (err, files) => {
    if (err) {
      console.log(err);
    } else {
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        const relativePath = path.relative(
          path.join(__dirname, upload_folder),
          fullPath
        );

        if (file.isDirectory()) {
          const subFiles = await listFilesRecursively(fullPath);
          fileList.push({
            name: file.name,
            type: "directory",
            path: relativePath,
            children: subFiles,
          });
        } else {
          fileList.push({
            name: file.name,
            type: "file",
            path: relativePath,
          });
        }
      }
    }
  });
  return fileList;
}

// Create initial uploads directory
const uploadDir = path.join(__dirname, "uploads");
await mkdir(uploadDir, { recursive: true }, (err) => {
  if (err) console.error(err);
  console.log("Uploads directory created or verified");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
