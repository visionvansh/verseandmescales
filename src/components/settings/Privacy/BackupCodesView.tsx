"use client";
import { motion } from "framer-motion";
import {
  FaKey,
  FaExclamationTriangle,
  FaClipboard,
  FaClipboardCheck,
  FaFileDownload,
  FaPrint,
} from "react-icons/fa";

const BackupCodesView = ({ 
  backupCodes, 
  copiedIndex, 
  setCopiedIndex,
  onBackupCodesConfirmation 
}) => {

  const handleCopyBackupCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const handleDownloadBackupCodes = () => {
    if (!backupCodes.length) return;

    const content =
      "# BACKUP CODES - KEEP THESE SAFE" +
      "These backup codes are for your account and can be used to verify your identity if you lose access" +
      "to your authenticator app or mobile device. Each code can only be used ONCE." +
      backupCodes.join("") +
      "" +
      "Generated on: " +
      new Date().toLocaleString() +"" +
      "DO NOT SHARE THESE CODES WITH ANYONE.";

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintBackupCodes = () => {
    if (!backupCodes.length) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      console.error("Unable to open print window. Please check your popup blocker settings.");
      return;
    }

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>2FA Backup Codes</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 2em;
              line-height: 1.5;
            }
            h1 {
              margin-bottom: 1em;
            }
            .codes {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 1em;
              margin: 2em 0;
            }
            .code {
              font-family: monospace;
              font-size: 1.2em;
              padding: 0.5em;
              border: 1px solid #ccc;
              border-radius: 4px;
              text-align: center;
              background-color: #f9f9f9;
            }
            .warning {
              border-top: 1px solid #999;
              margin-top: 2em;
              padding-top: 1em;
              color: #666;
            }
            @media print {
              body {
                margin: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>Two-Factor Authentication Backup Codes</h1>
          <p>These backup codes can be used to access your account if you lose access to your authenticator device. Each code can only be used once.</p>
          
          <div class="codes">
            ${backupCodes.map((code) => `<div class="code">${code}</div>`).join("")}
          </div>
          
          <p>Generated on: ${new Date().toLocaleString()}</p>
          
          <div class="warning">
            <p><strong>Important:</strong> Keep these codes in a secure location. Anyone with access to these codes could potentially access your account.</p>
          </div>
          
          <button class="no-print" onclick="window.print(); window.close();" style="margin-top: 2em; padding: 0.5em 1em; cursor: pointer;">Print</button>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();

    // Trigger print automatically
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-gray-900/30 border border-yellow-500/30 rounded-xl p-6">
        <h5 className="text-white font-medium text-lg mb-4 flex items-center">
          <FaKey className="mr-2 text-yellow-400" />
          Backup Codes - Store These Safely
        </h5>

        <div className="bg-yellow-900/20 border border-yellow-500/20 p-4 rounded-lg mb-4">
          <p className="text-yellow-400 text-sm mb-2 flex items-start">
            <FaExclamationTriangle className="mr-2 mt-0.5 flex-shrink-0" />
            <span>
              These backup codes are your{" "}
              <strong>emergency access</strong> to your account
              if you lose your phone or authenticator app. Each
              code can only be used once.
            </span>
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg border border-gray-700/30 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-gray-900/80 p-2 rounded border border-gray-700/30"
              >
                <code className="font-mono text-gray-300">
                  {code}
                </code>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyBackupCode(code, index)
                  }
                  className="text-gray-400 hover:text-white ml-2"
                >
                  {copiedIndex === index ? (
                    <FaClipboardCheck className="text-green-400" />
                  ) : (
                    <FaClipboard />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <motion.button
            type="button"
            onClick={handleDownloadBackupCodes}
            className="flex-1 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaFileDownload className="mr-2" />
            Download Codes
          </motion.button>

          <motion.button
            type="button"
            onClick={handlePrintBackupCodes}
            className="flex-1 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaPrint className="mr-2" />
            Print Codes
          </motion.button>

          <motion.button
            type="button"
            onClick={onBackupCodesConfirmation}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            I've Saved My Backup Codes
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default BackupCodesView;