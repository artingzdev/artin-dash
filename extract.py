import xml.etree.ElementTree as ET
import base64
import gzip
import os
import json


# --------------------------------------------------
# PROPERTY MAPS
# --------------------------------------------------

HEADER_KEY_MAP = {
    "kA1": ("audioTrack", int),
    "kA2": ("gamemode", int),
    "kA3": ("miniMode", bool),
    "kA4": ("speed", int),
    "kA5": ("obj2Blending", bool),
    "kA6": ("backgroundTextureId", int),
    "kA7": ("groundTextureId", int),
    "kA8": ("dualMode", bool),
    "kA9": ("levelStartPosObject", bool),
    "kA10": ("twoPlayerMode", bool),
    "kA11": ("flipGravity", bool),
    "kA12": ("color3Blending", bool),
    "kA13": ("songOffset", float),
    "kA14": ("guidelines", str),
    "kA15": ("fadeIn", bool),
    "kA16": ("fadeOut", bool),
    "kA17": ("groundLine", int),
    "kA18": ("font", int),
    "kA20": ("reverseGameplay", bool),
    "kA22": ("platformerMode", bool),
    "kA25": ("middlegroundTextureId", int),
    "kA27": ("allowMultiRotation", bool),
    "kA28": ("mirrorMode", bool),
    "kA29": ("rotateGameplay", bool),
    "kA31": ("enablePlayerSqueeze", bool),
    "kA32": ("fixGravityBug", bool),
    "kA33": ("fixNegativeScale", bool),
    "kA34": ("fixRobotJump", bool),
    "kA36": ("spawnGroup", int),
    "kA37": ("dynamicLevelHeight", bool),
    "kA38": ("sortGroups", bool),
    "kA39": ("fixRadiusCollision", bool),
    "kA40": ("enable22Changes", bool),
    "kA41": ("allowStaticRotate", bool),
    "kA42": ("reverseSync", bool),
    "kA43": ("noTimePenalty", bool),
    "kA45": ("decreaseBoostSlide", bool),
    "kS39": ("colorPage", int),
}


OBJECT_KEY_MAP = {
    "1": ("objectId", int),
    "2": ("x", float),
    "3": ("y", float),
    "4": ("flipH", bool),
    "5": ("flipV", bool),
    "6": ("rotation", float),
    "7": ("red", int),
    "8": ("green", int),
    "9": ("blue", int),
    "10": ("duration", float),
    "11": ("touchTriggered", bool),
    "12": ("secretCoinId", int),
    "13": ("specialObjectChecked", bool),
    "14": ("tintGround", bool),
    "15": ("playerColor1", bool),
    "16": ("playerColor2", bool),
    "17": ("blending", bool),
    "19": ("colorChannel19", int),
    "20": ("editorLayer1", int),
    "21": ("mainColorChannelId", int),
    "22": ("secondaryColorChannelId", int),
    "23": ("targetColorId", int),
    "24": ("zLayer", int),
    "25": ("zOrder", int),
    "28": ("offsetX", int),
    "29": ("offsetY", int),
    "30": ("easing", int),
    "31": ("text", str),
    "32": ("scale", float),
    "33": ("singleGroupId", int),
    "34": ("groupParent", bool),
    "35": ("opacity", float),
    "36": ("interactible", bool),
    "41": ("mainColorHsvEnabled", bool),
    "42": ("secondaryColorHsvEnabled", bool),
    "43": ("mainColorHsv", str),
    "44": ("secondaryColorHsv", str),
    "45": ("fadeIn", float),
    "46": ("hold", float),
    "47": ("fadeOut", float),
    "48": ("pulseMode", int),
    "49": ("copiedColorHsv", str),
    "50": ("copiedColorId", int),
    "51": ("targetGroupId", int),
    "52": ("pulseTargetType", int),
    "54": ("yellowPortalYOffset", float),
    "55": ("teleportPortalEase", bool),
    "56": ("activateGroup", bool),
    "57": ("groupIds", list),
    "58": ("lockToPlayerX", bool),
    "59": ("lockToPlayerY", bool),
    "60": ("copyOpacity", bool),
    "61": ("editorLayer2", int),
    "62": ("spawnTriggered", bool),
    "63": ("spawnDelay", float),
    "64": ("dontFade", bool),
    "65": ("mainOnly", bool),
    "66": ("detailOnly", bool),
    "67": ("dontEnter", bool),
    "68": ("degrees", int),
    "69": ("times360", int),
    "70": ("lockObjectRotation", bool),
    "71": ("secondaryGroupId", int),
    "72": ("xMod", float),
    "73": ("yMod", float),
    "75": ("strength", float),
    "76": ("animationId", int),
    "77": ("count", int),
    "78": ("subtractCount", bool),
    "79": ("pickupMode", int),
    "80": ("itemBlockId", int),
    "81": ("holdMode", bool),
    "82": ("toggleMode", int),
    "84": ("interval", float),
    "85": ("easingRate", float),
    "86": ("exclusive", bool),
    "87": ("multiTrigger", bool),
    "88": ("comparison", int),
    "89": ("dualMode", bool),
    "90": ("speed", float),
    "91": ("followDelay", float),
    "92": ("yOffset", float),
    "93": ("triggerOnExit", bool),
    "94": ("dynamicBlock", bool),
    "95": ("blockBId", int),
    "96": ("disableGlow", bool),
    "97": ("customRotationSpeed", float),
    "98": ("disableRotation", bool),
    "99": ("multiActivateOrbs", bool),
    "100": ("enableUseTarget", bool),
    "101": ("targetPosCoordinates", int),
    "102": ("editorDisable", bool),
    "103": ("highDetail", bool),
    "104": ("multiActivateTriggers", bool),
    "105": ("maxSpeed", float),
    "106": ("randomizeStart", bool),
    "107": ("animationSpeed", float),
    "108": ("linkedGroupId", int),
    "110": ("exitStatic", bool),
    "111": ("freeMode", bool),
    "112": ("editCameraSettings", bool),
    "113": ("easingFreeMode", int),
    "114": ("padding", float),
    "115": ("ord", int),
    "116": ("noEffects", bool),
    "117": ("reverse", bool),
    "120": ("timeMod", float),
    "121": ("noTouch", bool),
    "128": ("scaleX", float),
    "129": ("scaleY", float),
    "131": ("warpYAngle", float),
    "132": ("warpXAngle", float),
    "533": ("changeID", int)
}


# --------------------------------------------------
# TYPE CASTING + PARSING (unchanged logic)
# --------------------------------------------------

def cast_value(value, cast_type=None):

    if cast_type == bool:
        return value == "1"

    if cast_type == int:
        return int(float(value))

    if cast_type == float:
        return float(value)

    if cast_type == list:
        return [int(x) for x in value.split(".")]

    return value


def parse_object(obj_raw):
    parts = obj_raw.split(",")
    obj = {}

    for i in range(0, len(parts) - 1, 2):
        key = parts[i]
        value = parts[i + 1]

        # ---- Special case: groupIds (key 57)
        if key == "57":
            obj["groupIds"] = [int(x) for x in value.split(".") if x]
            continue

        if key in OBJECT_KEY_MAP:
            name, cast_type = OBJECT_KEY_MAP[key]
            obj[name] = cast_value(value, cast_type)
        else:
            obj[key] = value

    return obj


def parse_header(header_raw):
    entries = header_raw.split(",")
    header = {}
    i = 0

    while i < len(entries):
        key = entries[i]

        if key == "kS38":
            groups = entries[i + 1].split("|")
            header["color"] = []
            for g in groups:
                if not g:
                    continue
                sub = {}
                parts = g.split("_")
                for j in range(0, len(parts) - 1, 2):
                    sub[parts[j]] = parts[j + 1]
                header["color"].append(sub)
            i += 2
        elif key in HEADER_KEY_MAP:
            name, cast_type = HEADER_KEY_MAP[key]
            header[name] = cast_value(entries[i + 1], cast_type)
            i += 2
        else:
            header[key] = cast_value(entries[i + 1])
            i += 2

    return header


def convert_raw_to_structured(raw_data):
    sections = raw_data.split(";", 1)

    header = parse_header(sections[0])
    objects = []

    if len(sections) > 1:
        for obj_raw in sections[1].split(";"):
            obj_raw = obj_raw.strip()
            if obj_raw:
                objects.append(parse_object(obj_raw))

    return {
        "header": header,
        "objects": objects
    }


def extract_k4_data(gmd_file):
    tree = ET.parse(gmd_file)
    root = tree.getroot()

    dict_elem = root.find('dict')
    found_k4 = False

    for child in dict_elem:
        if found_k4 and child.tag == 's':
            return child.text
        if child.tag == 'k' and child.text == 'k4':
            found_k4 = True

    raise ValueError("k4 not found")


def decompress_data(encoded):
    decoded = base64.urlsafe_b64decode(encoded)
    return gzip.decompress(decoded).decode("utf-8")


def main():
    input_file = "pstTest.gmd"

    raw = decompress_data(extract_k4_data(input_file))
    structured = convert_raw_to_structured(raw)

    output_file = os.path.splitext(input_file)[0] + ".json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(structured, f, indent=4)

    print(f"JSON written to {output_file}")


if __name__ == "__main__":
    main()