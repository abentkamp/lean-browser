wget -c https://github.com/leanprover/lean4-nightly/releases/download/nightly-2022-08-05/lean-4.0.0-nightly-2022-08-05-linux.tar.zst   
tar --use-compress-program=unzstd -xvf lean-4.0.0-nightly-2022-08-05-linux.tar.zst
ln -s ./lean-4.0.0-nightly-2022-08-05-linux/bin/lean ./lean