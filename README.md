POC - Client-side ZIP and upload a list of files
================================================

This is a simple Proof of Concept of an application that generates
a `ZIP` file from a list of files that the user has selected from his
local filesystem.

Note that this is not compatible with all browsers. It has only been
tested with Chrome 20.0.

## Requirements

In order to run this POC, you must have [node.js](http://nodejs.org)
and [npm](https://npmjs.org/) installed.

Once the requirements are met, clone the repository and simply run:

1. `npm install`
  - This will install all the dependencies of the project
2. `npm start`
  - This will start the HTTP server on port 3000.

After this, you should be able to access `http://localhost:3000/`.
Select the files you want to upload in there, and once the files
are uploaded, you should see a `ZIP` file with the contents you
selected in the `uploads` folder.

## ZIP specification

* Full specs: http://www.pkware.com/documents/casestudies/APPNOTE.TXT
* AES encryption support: http://www.winzip.com/aes_info.htm
* AES encryption support tips: tipshttp://www.winzip.com/win/en/aes_tips.htm

Check below an overview of the changes that need to be done in order to add support for AES. This is based on http://www.winzip.com/aes_info.htm

I. Encryption services

A. Base format reference

- new "extra data" field
- new compression method code
- value in the CRC field dependant on the encryption version (AE-1 or AE-2)

B. Compression method and encryption flag

- bit 0 of the "general purpose bit flags" field must be set to 1 in each AES-encrypted file's local header and central directory entry
- presence of an AES-encrypted file in a Zip file is indicated by a new compression method code (decimal 99) in the file's local header and central directory entry, used along with the AES extra data field (no change in either the "version made by" or "version needed to extract" codes)
- code for the actual compression method is stored in the AES extra data field

C. CRC value

- encrypted using the AE-2 method, the standard Zip CRC value is not used, and a 0 must be stored in this field
- files encrypted using the AE-1 method do include the standard Zip CRC value
- vendor version stored in the AES extra data field is 0x0001 for AE-1 and 0x0002 for AE-2

D. AES extra data field

- "extra data" field is stored both in the local header and central directory entry for the file
- the extra data field for AES encryption is 0x9901. Fields are all stored in Intel low-byte/high-byte order (little-endian)
- The extra data field currently has a length of 11: seven data bytes plus two bytes for the header ID and two bytes for the data size. Therefore, the extra data overhead for each file in the archive is 22 bytes (11 bytes in the central header plus 11 bytes in the local header)
- format of the data in the AES extra data field is as follows:

```
Offset    Size(bytes)    Content
-------------------------------------------------------------------------------------------
0        2            Extra field header ID (0x9901)                                          -> 
2        2            Data size (currently 7, but subject to possible increase in the future) -> this value is currently 7
4        2            Integer version number specific to the zip vendor                       -> 0x0001 for AE-1, 0x0002 for AE-2
6        2            2-character vendor ID                                                   -> should always be set to the two ASCII characters "AE"
8        1            Integer mode value indicating AES encryption strength                   -> 0x01 for 128-bit encryption key, 0x02 for 192-bit encryption key, 0x03 for 256-bit encryption key
9        2            The actual compression method used to compress the file                 -> 99 is used to indicate the presence of an AES-encrypted file
-------------------------------------------------------------------------------------------
```

II. Zip file format

A. File format

- format of the stored file is (note that all fields are byte-aligned):

```
Size (bytes)    Content
-------------------------------------------
Variable        Salt value
2               Password verification value
Variable        Encrypted file data
10              Authentication code
-------------------------------------------
```

- "compressed size" fields of the local file header and central directory entry is the sum of 4 values above

B. Salt value

- the salt value is a random sequence of bytes that is combined with the encryption password to create encryption and authentication keys, and is stored unencrypted with the file data
- make sure that each encrypted file uses a different salt, within a single archive
- salt value size depends on the key length:

```
Key size    Salt size
---------------------
128 bits    8 bytes
192 bits    12 bytes
256 bits    16 bytes
---------------------
```

C. Password verification value

- password verification value is produced as part of the process that derives the encryption and decryption keys from the password, and is stored unencrypted. Consult http://www.winzip.com/win/en/aes_tips.htm for details on how to obtain this value

D. Encrypted file data

- encryption is applied only to the content of files, and after compression. Encryption is done byte-for-byte using AES in CTR mode, so the lengths of the original data and encrypted data are the same
- although data is encrypted byte-for-byte, it is presented to the encryption and decryption funcions in blocks of 16 bytes (last block may be smaller)

E. Authentication code

- information on how to obtain it is in http://www.winzip.com/win/en/aes_tips.htm
- authentication code is stored unencrypted, byte-aligned, and immediately follows the last byte of encrypted data
- more information on http://www.winzip.com/aes_info.htm#auth-faq
