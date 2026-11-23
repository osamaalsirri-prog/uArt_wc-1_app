# uArt WC-01 Android App

This repository contains the Android Studio v6 application for the uArt WC-01 controller, packaged as `uArt_WC01_Android_Source.zip`.

Every push to `main` runs a GitHub Actions workflow to build a **debug APK**. Download it from the successful workflow run under **Artifacts**. This is a test build, not a Google Play release build.

The mobile app is a companion to ESP32 firmware; successful Android compilation does not prove that connected welding machinery is safe. Do not store your Wi-Fi password or pairing key in the repository.
