load("//tensorboard/defs:defs.bzl", "tf_ts_library")

package(default_visibility = ["//tensorboard:internal"])

licenses(["notice"])

tf_ts_library(
    name = "d3",
    srcs = ["d3.ts"],
    deps = [
        "@npm//@types/d3",
        "@npm//d3",
    ],
)

tf_ts_library(
    name = "tfjs",
    srcs = ["tfjs.ts"],
    deps = [
        "@npm//@tensorflow/tfjs",
    ],
)

tf_ts_library(
    name = "marked",
    srcs = ["marked.ts"],
    deps = [
        "@npm//@types/marked",
        "@npm//marked",
    ],
)

tf_ts_library(
    name = "numeric",
    srcs = ["numeric.ts"],
    strict_checks = False,
    deps = [
        "@npm//numeric",
    ],
)
