import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as XLSX from "xlsx";

export const OpenGoogleXlsxPicker = async () => {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    console.log("openFilePicker ~ ", res.name);
    const fileData = await FileSystem.readAsStringAsync(res.uri, {
      encoding: FileSystem.EncodingType.Base64,
    }).then((b64) => XLSX.read(b64, { type: "base64" }));
    console.log("OpenXLSXPicker ~ fileData", fileData);
    return fileData;
  } catch (err) {
    console.error(err);
  }
};
