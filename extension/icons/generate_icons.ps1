Add-Type -AssemblyName System.Drawing

foreach ($size in @(16, 48, 128)) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))

    # Shield gradient brush
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.Point]::new(0, 0),
        [System.Drawing.Point]::new($size, $size),
        [System.Drawing.Color]::FromArgb(99, 102, 241),
        [System.Drawing.Color]::FromArgb(124, 58, 237)
    )

    # Shield shape points
    $points = @(
        [System.Drawing.PointF]::new($size / 2, $size * 0.06),
        [System.Drawing.PointF]::new($size * 0.875, $size * 0.22),
        [System.Drawing.PointF]::new($size * 0.875, $size * 0.47),
        [System.Drawing.PointF]::new($size / 2, $size * 0.94),
        [System.Drawing.PointF]::new($size * 0.125, $size * 0.47),
        [System.Drawing.PointF]::new($size * 0.125, $size * 0.22)
    )

    $g.FillPolygon($brush, $points)

    # White lock body
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $lockW = $size * 0.25
    $lockH = $size * 0.2
    $lockX = ($size - $lockW) / 2
    $lockY = $size * 0.48
    $g.FillRectangle($whiteBrush, $lockX, $lockY, $lockW, $lockH)

    # Lock shackle arc
    $penWidth = [Math]::Max(1, $size * 0.04)
    $pen = New-Object System.Drawing.Pen($whiteBrush, $penWidth)
    $arcSize = $size * 0.18
    $g.DrawArc($pen, ($size - $arcSize) / 2, $lockY - $arcSize * 0.6, $arcSize, $arcSize, 180, 180)

    $g.Dispose()
    $outPath = "d:\projects\PrivaShield\PrivaShield-AI\extension\icons\icon$size.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created $outPath"
}
