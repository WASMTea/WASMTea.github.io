/* tslint:disable */
/* eslint-disable */

export class Graph {
    free(): void;
    [Symbol.dispose](): void;
    add_edge(from: number, to: number): boolean;
    add_vertex(x: number, y: number): number;
    /**
     * Run all graph analyses and return a JSON report.
     */
    analyze(): string;
    delete_edge(id: number): void;
    delete_vertex(id: number): void;
    edge_count(): number;
    edges_json(): string;
    /**
     * Clear the graph and generate a named preset.
     * `kind`: complete | cycle | path | star | wheel | petersen | bipartite | grid
     * `n`: size parameter (ignored for petersen)
     * `cx`, `cy`: canvas centre to layout around
     * `radius`: layout radius in pixels
     */
    generate(kind: string, n: number, cx: number, cy: number, radius: number): void;
    move_vertex(id: number, x: number, y: number): void;
    constructor();
    vertex_at(x: number, y: number): number;
    vertex_count(): number;
    static vertex_radius(): number;
    vertices_json(): string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_graph_free: (a: number, b: number) => void;
    readonly graph_add_edge: (a: number, b: number, c: number) => number;
    readonly graph_add_vertex: (a: number, b: number, c: number) => number;
    readonly graph_analyze: (a: number) => [number, number];
    readonly graph_delete_edge: (a: number, b: number) => void;
    readonly graph_delete_vertex: (a: number, b: number) => void;
    readonly graph_edge_count: (a: number) => number;
    readonly graph_edges_json: (a: number) => [number, number];
    readonly graph_generate: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly graph_move_vertex: (a: number, b: number, c: number, d: number) => void;
    readonly graph_new: () => number;
    readonly graph_vertex_at: (a: number, b: number, c: number) => number;
    readonly graph_vertex_count: (a: number) => number;
    readonly graph_vertex_radius: () => number;
    readonly graph_vertices_json: (a: number) => [number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
