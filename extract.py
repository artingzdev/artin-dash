import sys
import xml.etree.ElementTree as ET
import base64
import gzip
import os

def extract_k4_data(gmd_file):

    tree = ET.parse(gmd_file)
    root = tree.getroot()
    

    dict_elem = root.find('dict')
    if dict_elem is None:
        raise ValueError("No <dict> found in the plist.")
    

    found_k4 = False
    encoded_data = None
    for child in dict_elem:
        if found_k4:
            if child.tag == 's':
                encoded_data = child.text
                break
            else:
                raise ValueError("Expected <s> after <k>k4</k>")
        if child.tag == 'k' and child.text == 'k4':
            found_k4 = True
    
    if encoded_data is None:
        raise ValueError("k4 key not found in the GMD file.")
    
    return encoded_data

def decompress_data(encoded_data):

    decoded_bytes = base64.urlsafe_b64decode(encoded_data)
    

    decompressed_bytes = gzip.decompress(decoded_bytes)
    

    raw_data = decompressed_bytes.decode('utf-8')
    
    return raw_data

def main():
    if len(sys.argv) != 2:
        print("Usage: python script.py <input.gmd>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    

    encoded = extract_k4_data(input_file)
    

    raw = decompress_data(encoded)
    

    dir_path = os.path.dirname(input_file)
    base_name = os.path.splitext(os.path.basename(input_file))[0]
    output_file = os.path.join(dir_path, base_name + '.txt')
    

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(raw)
    
    print(f"Raw data written to {output_file}")

if __name__ == "__main__":
    main()