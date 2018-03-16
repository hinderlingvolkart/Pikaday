import buble from 'rollup-plugin-buble';

export default {
    plugins: [
        buble({
            jsx: 'h'
        })
    ],
    external: ['preact']
}