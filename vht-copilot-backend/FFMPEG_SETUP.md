# FFmpeg Setup Instructions

## Your FFmpeg Location
```
C:\Users\USER\Downloads\ffmpeg-8.0.1-essentials_build\bin\ffmpeg.exe
```

## Add to Windows PATH (Required)

### Method 1: Using System Settings (Recommended)

1. **Open Environment Variables**:
   - Press `Win + X`
   - Select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables..."

2. **Edit PATH Variable**:
   - Under "System variables" (or "User variables"), find `Path`
   - Click "Edit..."
   - Click "New"
   - Add: `C:\Users\USER\Downloads\ffmpeg-8.0.1-essentials_build\bin`
   - Click "OK" on all windows

3. **Restart VS Code**:
   - Close ALL VS Code windows
   - Open VS Code again
   - Open new terminal

4. **Test**:
   ```powershell
   ffmpeg -version
   ```
   Should show: `ffmpeg version 8.0.1`

### Method 2: Using PowerShell (Admin Required)

**Run PowerShell as Administrator**, then:

```powershell
# Get current PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

# Add FFmpeg to PATH
$newPath = "$currentPath;C:\Users\USER\Downloads\ffmpeg-8.0.1-essentials_build\bin"
[Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")

# Verify
ffmpeg -version
```

Then restart VS Code.

## Temporary Fix (Until Restart)

In your current terminal session:

```powershell
$env:PATH += ";C:\Users\USER\Downloads\ffmpeg-8.0.1-essentials_build\bin"
ffmpeg -version
python manage.py runserver
```

This only works until you close the terminal.

## Alternative: Move FFmpeg to Standard Location

Move the folder to `C:\ffmpeg`:

```powershell
# Create folder
New-Item -ItemType Directory -Force -Path C:\ffmpeg

# Move FFmpeg
Move-Item "C:\Users\USER\Downloads\ffmpeg-8.0.1-essentials_build\*" "C:\ffmpeg\"

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$newPath = "$currentPath;C:\ffmpeg\bin"
[Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
```

Then restart VS Code.

## Testing

After adding to PATH and restarting VS Code:

1. Open new terminal
2. Run: `ffmpeg -version`
3. If you see ffmpeg version info ✅ Success!
4. Restart Django: `python manage.py runserver`
5. Try recording audio in the app

## What FFmpeg Does

- Converts audio files from `.m4a` / `.mp3` → `.wav`
- Required for FREE speech recognition
- One-time setup, then works forever

## If You Get Errors

**"ffmpeg not recognized as command"**:
- PATH not updated yet
- Need to restart VS Code after adding to PATH

**"Access denied"**:
- Need to run PowerShell as Administrator
- Or use Method 1 (System Settings)

**Still not working**:
- Try the "Temporary Fix" above
- Or use text mode instead (no FFmpeg needed!)
