import { Immer } from './internal'

const immer = new Immer()
export const produce = immer.produce
export default produce