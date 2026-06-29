using StockMovementTrackerSystem.Application.Interfaces;
using System.Security.Cryptography;

namespace StockMovementTrackerSystem.Infrastructure.Services;

public class EncryptionService : IEncryptionService
{
    public CryptoStream EncryptStream(Stream responseStream)
    {
        Aes aes = GetEncryptionAlgorithm();
        ToBase64Transform base64Transform = new();
        CryptoStream base64EncodedStream = new(responseStream, base64Transform, CryptoStreamMode.Write);
        ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        CryptoStream cryptoStream = new(base64EncodedStream, encryptor, CryptoStreamMode.Write);
        return cryptoStream;
    }
    public byte[] Encrypt(string plainText)
    {
        using Aes aes = GetEncryptionAlgorithm();
        ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using MemoryStream ms = new();
        // Write IV first
        ms.Write(aes.IV, 0, aes.IV.Length);
        using (CryptoStream cs = new(ms, encryptor, CryptoStreamMode.Write))
        using (StreamWriter sw = new(cs))
            sw.Write(plainText);
        byte[] encrypted = ms.ToArray();
        return encrypted;
    }
    public CryptoStream DecryptStream(Stream cipherStream)
    {
        Aes aes = GetEncryptionAlgorithm();
        FromBase64Transform base64Transform = new(FromBase64TransformMode.IgnoreWhiteSpaces);
        CryptoStream base64DecodedStream = new(cipherStream, base64Transform, CryptoStreamMode.Read);
        ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        CryptoStream decryptedStream = new(base64DecodedStream, decryptor, CryptoStreamMode.Read);
        return decryptedStream;
    }

    public string DecryptString(string cipherText)
    {
        byte[] buffer = Convert.FromBase64String(cipherText);
        using MemoryStream ms = new(buffer);
        using Aes aes = GetEncryptionAlgorithm();
        ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        using CryptoStream cs = new(ms, decryptor, CryptoStreamMode.Read);
        using StreamReader sr = new(cs);
        return sr.ReadToEnd();
    }

    private static Aes GetEncryptionAlgorithm()
    {
        Aes aes = Aes.Create();
        byte[] secretKey = "5171061885171061"u8.ToArray();
        byte[] initializationVector = "5171061885171061"u8.ToArray();
        aes.Key = secretKey;
        aes.IV = initializationVector;
        return aes;
    }
}
