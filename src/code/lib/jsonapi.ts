/* eslint-disable no-redeclare */
/**
 * jsonapi 규격으로 전달된 api 응답을 js 에서 활용하기 좋도록 변경합니다.
 *
 * 버전: 1.2.0
 * 변경 내역 :
 * - relationship의 존재에 따라 속성의 존재성 (null, undefined) 변경
 */

import camelcaseKeys from "camelcase-keys"
import _ from "lodash"

interface Datum {
  id: string
  type: string
  attributes: Record<string, unknown>
  // 실제로는 relationsships가 항상 존재하나
  // 활용 편의를 위해 optional로 선언합니다.
  relationships?: Record<string, Relationship>
}

interface Relationship {
  // include 인자를 API에 전달하지 않으면 undefined가 됩니다.
  data?: { id: string; type: string } | { id: string; type: string }[] | null
}

interface ConvertedDatum {
  id: string
  type: string
  [key: string]: unknown
}

/*
json api 에서 data 는 다음 형태를 취합니다.
{
  id: "123",
  type: "Profile",
  attributes: {..},    
}

이 data 를 다음과 같이 변환합니다.
{
  id: "123",
  type: "Profile",
  someAttribute: ...,
}
*/
function convertDatum(datum: Datum, stopPaths?: string[]): ConvertedDatum {
  return camelcaseKeys(
    {
      id: datum.id,
      type: datum.type,
      ...datum.attributes,
    },
    { deep: true, stopPaths: stopPaths }
  )
}

function convertData(data: Datum[], stopPaths?: string[]): ConvertedDatum[]
function convertData(data: Datum, stopPaths?: string[]): ConvertedDatum
function convertData(
  data: Datum[] | Datum,
  stopPaths?: string[]
): ConvertedDatum[] | ConvertedDatum {
  if (Array.isArray(data)) {
    return data.map((datum) => convertDatum(datum, stopPaths))
  } else {
    return convertDatum(data, stopPaths)
  }
}

function includeConvertedDatum(
  convertedDatum: ConvertedDatum,
  relationships: Record<string, Relationship>,
  includedHash: Map<string, ConvertedDatum>
) {
  const includedDatum = convertedDatum
  for (const key in relationships) {
    const relationData = relationships[key].data
    const _key = _.camelCase(key)
    if (Array.isArray(relationData)) {
      includedDatum[_key] = relationData
        .map((relation) => includedHash.get(relation.type + relation.id))
        .filter((relation) => relation)
    } else if (relationData) {
      // include 했고 relation 이 있는 경우
      // 단, relation이 있지만 대상 객체가 없는 경우 includedHash.get()이 undefined 입니다.
      // ex) subscription_grant_id 는 있으나 SubscriptionGrant 객체가 없다.
      // 이 경우에는 null을 전달하는 것이 적절합니다.
      includedDatum[_key] =
        includedHash.get(relationData.type + relationData.id) ?? null
    } else if (relationData === null) {
      // include 했지만 relation 이 없는 경우
      includedDatum[_key] = null
    }
  }
  return includedDatum
}

function includeAndConvert(
  data: Datum[] | Datum,
  included: Datum[] | undefined,
  stopPaths?: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const includedHash: Map<string, ConvertedDatum> = new Map()

  if (included) {
    // 중첩된 relationships를 단 한번 순회(O(N))에 해결하기 위해
    // 하나의 data에 대해서 하나의 object 만 생성합니다.
    // convertedIncluded 가 그 object 입니다.
    const convertedIncluded = included.map((data: Datum) =>
      convertDatum(data, stopPaths)
    )
    convertedIncluded.forEach((data: ConvertedDatum) => {
      includedHash.set(data.type + data.id, data)
    })

    convertedIncluded.forEach((data: ConvertedDatum, index: number) => {
      includeConvertedDatum(
        data,
        included[index].relationships ?? {},
        includedHash
      )
    })
  }

  if (Array.isArray(data)) {
    return data.map((datum) =>
      includeConvertedDatum(
        convertData(datum, stopPaths),
        datum.relationships ?? {},
        includedHash
      )
    )
  } else {
    return includeConvertedDatum(
      convertData(data, stopPaths),
      data.relationships ?? {},
      includedHash
    )
  }
}

export { convertData, includeAndConvert }
