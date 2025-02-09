export default function filterObjectKeys(object: Record<string, any>, search: string) {
  const filteredObject: Record<string, any> = {};

  for (const key in object) {
    if (key.includes(search)) {
      filteredObject[key] = object[key];
    }
  }

  return filteredObject;
}