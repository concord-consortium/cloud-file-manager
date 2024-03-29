#!/bin/bash
PROJECT_ID=125177
OUTPUT_DIR=src/code/utils/lang
# de: German
# el: Greek
# es: Spanish
# fa: Farsi
# he: Hebrew
# ja: Japanese
# ko: Korean
# nb: Norwegian Bokmal
# nn: Norwegian Nynorsk
# pl: Polish Polski
# pt-BR: Brazilian Portuguese
# tr: Turkish
# zh-Hans: Simplified Chinese
# zh-TW: Traditional Chinese (Taiwan)
LANGUAGES=("de" "el" "es" "fa" "he" "ja" "ko" "nb" "nn" "pl" "pt-BR" "th" "tr" "zh-Hans" "zh-TW")

# argument processing from https://stackoverflow.com/a/14203146
while [[ $# -gt 1 ]]
do
key="$1"

case $key in
    -a|--api_token)
    API_TOKEN="$2"
    shift # past argument
    ;;
    -o|--output_dir)
    OUTPUT_DIR="$2"
    shift # past argument
    ;;
esac
shift # past argument or value
done

for LANGUAGE in "${LANGUAGES[@]}"
do
    echo "Requesting strings for '$LANGUAGE'..."
    PULLARGS="-p $PROJECT_ID -l $LANGUAGE -o $OUTPUT_DIR -a $API_TOKEN"
    # echo "PULLARGS=$PULLARGS"
    ./bin/strings-pull.sh $PULLARGS
    echo ""
done

# update English strings as well (e.g. stripping comments)
./node_modules/.bin/strip-json-comments src/code/utils/lang/en-US-master.json \
                                      > src/code/utils/lang/en-US.json
