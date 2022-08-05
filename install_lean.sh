curl https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh -sSf | sh -s -- -y --default-toolchain leanprover/lean4:nightly
ln -s ~/.elan/bin/lean lean
~/.elan/bin/lean