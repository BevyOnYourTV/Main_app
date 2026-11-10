#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

SCRIPT_DIRECTORY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIRECTORY" && pwd)"
INSTALLATION_STATE="$PROJECT_ROOT/.toolbox-installations"
TEMP_DIRECTORY="$PROJECT_ROOT/tmp"
REMAINING_STATE=""

cleanup_temporary_state() {
    if [[ -n "$REMAINING_STATE" && -e "$REMAINING_STATE" ]]; then
        rm -- "$REMAINING_STATE"
    fi
}

trap cleanup_temporary_state EXIT

confirm_cleanup() {
    local answer

    printf 'Remove everything listed above? [y/N] '
    if ! read -r answer; then
        return 1
    fi

    case "$answer" in
        y | Y | yes | Yes | YES) return 0 ;;
        *) return 1 ;;
    esac
}

go_binary_path() {
    local go_bin
    local go_path

    go_bin="$(go env GOBIN)"
    if [[ -z "$go_bin" ]]; then
        go_path="$(go env GOPATH)"
        go_bin="${go_path%%:*}/bin"
    fi

    printf '%s/gum\n' "$go_bin"
}

describe_cleanup() {
    local tool="$1"
    local installer="$2"
    local target="$3"
    local context="$4"

    if [[ "$tool" != "gum" ]]; then
        return 1
    fi

    case "$installer" in
        apt) [[ "$target" == "gum" ]] && printf 'sudo apt remove gum' ;;
        brew) [[ "$target" == "gum" ]] && printf 'brew uninstall gum' ;;
        pacman) [[ "$target" == "gum" ]] && printf 'sudo pacman -R gum' ;;
        dnf) [[ "$target" == "gum" ]] && printf 'sudo dnf remove gum' ;;
        nix-env) [[ "$target" == "gum" ]] && printf 'nix-env --uninstall gum' ;;
        flox)
            [[ "$target" == "gum" && -n "$context" ]] \
                && printf '(in %s) flox uninstall gum' "$context"
            ;;
        go)
            command -v go >/dev/null 2>&1 \
                && [[ "$target" == "$(go_binary_path)" ]] \
                && printf 'rm -- %s' "$target"
            ;;
        *) return 1 ;;
    esac
}

run_cleanup() {
    local tool="$1"
    local installer="$2"
    local target="$3"
    local context="$4"

    [[ "$tool" == "gum" ]] || return 1

    case "$installer" in
        apt) [[ "$target" == "gum" ]] && sudo apt remove gum ;;
        brew) [[ "$target" == "gum" ]] && brew uninstall gum ;;
        pacman) [[ "$target" == "gum" ]] && sudo pacman -R gum ;;
        dnf) [[ "$target" == "gum" ]] && sudo dnf remove gum ;;
        nix-env) [[ "$target" == "gum" ]] && nix-env --uninstall gum ;;
        flox)
            if [[ "$target" == "gum" && -d "$context" ]]; then
                (cd -- "$context" && flox uninstall gum)
            else
                return 1
            fi
            ;;
        go)
            if command -v go >/dev/null 2>&1 \
                && [[ "$target" == "$(go_binary_path)" && -f "$target" ]]; then
                rm -- "$target"
            else
                return 1
            fi
            ;;
        *) return 1 ;;
    esac
}

if [[ ! -f "$INSTALLATION_STATE" ]]; then
    echo "Nothing to clean up: the toolbox has not recorded any external installations."
    exit 0
fi

entries=()
while IFS=$'\t' read -r tool installer target context || [[ -n "${tool:-}" ]]; do
    if [[ -z "${tool:-}" || "$tool" == \#* ]]; then
        continue
    fi

    if description="$(describe_cleanup "$tool" "$installer" "$target" "${context:-}")"; then
        printf -- '- %s: %s\n' "$tool" "$description"
        entries+=("$tool"$'\t'"$installer"$'\t'"$target"$'\t'"${context:-}")
    else
        printf 'Unsupported or invalid state entry: %s (%s)\n' "$tool" "$installer" >&2
        exit 1
    fi
done < "$INSTALLATION_STATE"

if [[ "${#entries[@]}" -eq 0 ]]; then
    echo "Nothing to clean up: the installation state is empty."
    exit 0
fi

if ! confirm_cleanup; then
    echo "Cleanup cancelled."
    exit 0
fi

mkdir -p -- "$TEMP_DIRECTORY"
REMAINING_STATE="$(mktemp "$TEMP_DIRECTORY/toolbox-uninstall.XXXXXX")"
printf '# tool<TAB>installer<TAB>target<TAB>context\n' > "$REMAINING_STATE"
failures=0

for entry in "${entries[@]}"; do
    IFS=$'\t' read -r tool installer target context <<< "$entry"
    if run_cleanup "$tool" "$installer" "$target" "${context:-}"; then
        printf 'Removed %s.\n' "$tool"
    else
        printf 'Failed to remove %s; keeping its state entry.\n' "$tool" >&2
        printf '%s\n' "$entry" >> "$REMAINING_STATE"
        failures=$((failures + 1))
    fi
done

if [[ "$failures" -eq 0 ]]; then
    rm -- "$INSTALLATION_STATE"
    rm -- "$REMAINING_STATE"
    REMAINING_STATE=""
    echo "External toolbox installations were successfully cleaned up."
else
    mv -- "$REMAINING_STATE" "$INSTALLATION_STATE"
    REMAINING_STATE=""
    echo "Cleanup completed with $failures failure(s)." >&2
    exit 1
fi
