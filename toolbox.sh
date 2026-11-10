#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

SCRIPT_DIRECTORY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIRECTORY" && pwd)"
INSTALLATION_STATE="$PROJECT_ROOT/.toolbox-installations"
INSTALL_METHOD=""
INSTALL_TARGET=""
INSTALL_CONTEXT=""

record_installation() {
    local entry
    local field

    for field in "$@"; do
        if [[ "$field" == *$'\t'* || "$field" == *$'\n'* ]]; then
            echo "Cannot record an installation containing a tab or newline." >&2
            return 1
        fi
    done

    entry="$1"$'\t'"$2"$'\t'"$3"$'\t'"$4"
    if [[ ! -e "$INSTALLATION_STATE" ]]; then
        printf '# tool<TAB>installer<TAB>target<TAB>context\n' > "$INSTALLATION_STATE"
        chmod 600 "$INSTALLATION_STATE"
    fi

    if ! grep -Fqx -- "$entry" "$INSTALLATION_STATE"; then
        printf '%s\n' "$entry" >> "$INSTALLATION_STATE"
    fi
}

confirm_install() {
    local answer

    printf 'Gum is required but is not installed.\n'
    printf 'Installation method: %s\n' "$1"
    printf 'Continue? [y/N] '

    if ! read -r answer; then
        return 1
    fi

    case "$answer" in
        y | Y | yes | Yes | YES) return 0 ;;
        *) return 1 ;;
    esac
}

install_gum_with_apt() {
    local required_command

    for required_command in sudo curl gpg; do
        if ! command -v "$required_command" >/dev/null 2>&1; then
            echo "Cannot install Gum with APT: '$required_command' is required." >&2
            return 1
        fi
    done

    printf '%s\n' \
        'The official Charm APT installation will run:' \
        '  sudo mkdir -p /etc/apt/keyrings' \
        '  curl -fsSL https://repo.charm.sh/apt/gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/charm.gpg' \
        '  echo "deb [signed-by=/etc/apt/keyrings/charm.gpg] https://repo.charm.sh/apt/ * *" | sudo tee /etc/apt/sources.list.d/charm.list' \
        '  sudo apt update' \
        '  sudo apt install gum'

    if ! confirm_install "Charm's official APT repository"; then
        return 1
    fi

    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://repo.charm.sh/apt/gpg.key \
        | sudo gpg --dearmor -o /etc/apt/keyrings/charm.gpg
    echo "deb [signed-by=/etc/apt/keyrings/charm.gpg] https://repo.charm.sh/apt/ * *" \
        | sudo tee /etc/apt/sources.list.d/charm.list
    sudo apt update
    sudo apt install gum
    INSTALL_METHOD="apt"
    INSTALL_TARGET="gum"
}

install_gum() {
    if command -v apt >/dev/null 2>&1; then
        install_gum_with_apt
    elif command -v brew >/dev/null 2>&1; then
        echo "Command: brew install gum"
        if confirm_install "Homebrew" && brew install gum; then
            INSTALL_METHOD="brew"
            INSTALL_TARGET="gum"
        else
            return 1
        fi
    elif command -v pacman >/dev/null 2>&1; then
        echo "Command: sudo pacman -S gum"
        if confirm_install "Pacman" && sudo pacman -S gum; then
            INSTALL_METHOD="pacman"
            INSTALL_TARGET="gum"
        else
            return 1
        fi
    elif command -v dnf >/dev/null 2>&1; then
        echo "Command: sudo dnf install gum"
        if confirm_install "DNF" && sudo dnf install gum; then
            INSTALL_METHOD="dnf"
            INSTALL_TARGET="gum"
        else
            return 1
        fi
    elif command -v nix-env >/dev/null 2>&1; then
        echo "Command: nix-env -iA nixpkgs.gum"
        if confirm_install "Nix" && nix-env -iA nixpkgs.gum; then
            INSTALL_METHOD="nix-env"
            INSTALL_TARGET="gum"
        else
            return 1
        fi
    elif command -v flox >/dev/null 2>&1; then
        echo "Command: flox install gum"
        if confirm_install "Flox" && flox install gum; then
            INSTALL_METHOD="flox"
            INSTALL_TARGET="gum"
            INSTALL_CONTEXT="$PWD"
        else
            return 1
        fi
    elif command -v go >/dev/null 2>&1; then
        echo "Command: go install charm.land/gum/v2@latest"
        if confirm_install "Go" && go install charm.land/gum/v2@latest; then
            local go_bin
            local go_path

            go_bin="$(go env GOBIN)"
            if [[ -z "$go_bin" ]]; then
                go_path="$(go env GOPATH)"
                go_bin="${go_path%%:*}/bin"
            fi

            INSTALL_METHOD="go"
            INSTALL_TARGET="$go_bin/gum"
        else
            return 1
        fi
    else
        echo "No supported Gum installation method was found." >&2
        echo "See https://github.com/charmbracelet/gum#installation" >&2
        return 1
    fi
}

if ! command -v gum >/dev/null 2>&1; then
    if ! install_gum || ! command -v gum >/dev/null 2>&1; then
        echo "Gum was not installed. Exiting." >&2
        exit 1
    fi

    if ! record_installation "gum" "$INSTALL_METHOD" "$INSTALL_TARGET" "$INSTALL_CONTEXT"; then
        echo "Gum was installed, but the installation could not be recorded." >&2
        exit 1
    fi
fi

while true; do
    option="$(gum choose \
        "Run Tests" \
        "Run Lint" \
        "Run Build" \
        "Exit" \
        --header "AirConsole toolbox")"

    case "$option" in
        "Run Tests")
            gum style --foreground 212 "Running tests..."
            # Add your test command here.
            ;;
        "Run Lint")
            gum style --foreground 212 "Running lint..."
            # Add your lint command here.
            ;;
        "Run Build")
            gum style --foreground 212 "Running build..."
            # Add your build command here.
            ;;
        "Exit")
            gum style --foreground 212 "Exiting..."
            break
            ;;
    esac
done
